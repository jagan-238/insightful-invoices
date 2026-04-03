import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeVendor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => !["inc", "llc", "ltd", "co", "corp", "company", "the"].includes(w))
    .join(" ");
}

function computeFormatHash(text: string): string {
  // Simple hash based on structural features of the invoice text
  const lines = text.split("\n").filter((l) => l.trim());
  const structure = lines
    .slice(0, Math.min(lines.length, 20))
    .map((l) => {
      const hasNumber = /\d/.test(l);
      const hasColon = l.includes(":");
      const len = l.trim().length > 40 ? "L" : l.trim().length > 15 ? "M" : "S";
      return `${hasNumber ? "N" : "_"}${hasColon ? "C" : "_"}${len}`;
    })
    .join("");
  // Simple string hash
  let hash = 0;
  for (let i = 0; i < structure.length; i++) {
    const char = structure.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoiceId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get invoice record
    const { data: invoice, error: fetchErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (fetchErr || !invoice) {
      throw new Error(`Invoice not found: ${fetchErr?.message}`);
    }

    // Update status to processing
    await supabase.from("invoices").update({ status: "processing" }).eq("id", invoiceId);

    // Download the file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("invoices")
      .download(invoice.file_path);

    if (dlErr || !fileData) {
      throw new Error(`Failed to download file: ${dlErr?.message}`);
    }

    // Convert file to base64 for Gemini vision
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const mimeType =
      invoice.file_type === "pdf"
        ? "application/pdf"
        : invoice.file_type === "png"
        ? "image/png"
        : "image/jpeg";

    // Check for existing format template
    let formatHint = "";
    if (invoice.format_hash) {
      const { data: format } = await supabase
        .from("invoice_formats")
        .select("*")
        .eq("format_hash", invoice.format_hash)
        .single();
      if (format?.field_mapping) {
        formatHint = `\nA similar invoice format has been seen ${format.times_seen} times before. Known field mapping: ${JSON.stringify(format.field_mapping)}. Use this as a guide but still extract from the actual document.`;
      }
    }

    const systemPrompt = `You are an expert invoice data extraction AI. Extract structured data from invoices with high accuracy.
Return a JSON object with these fields:
- vendor_name: string (the company/person who issued the invoice)
- invoice_number: string | null
- invoice_date: string | null (ISO date format YYYY-MM-DD)
- due_date: string | null (ISO date format YYYY-MM-DD)
- subtotal: number | null
- tax_amount: number | null
- total_amount: number | null (this is the most important field)
- currency: string (3-letter code like USD, EUR, INR, GBP)
- line_items: array of { description: string, quantity: number | null, unit_price: number | null, amount: number | null }
- confidence_score: number between 0 and 1 indicating your confidence in the extraction accuracy
- raw_text: string (the raw text you can read from the document)

Handle noisy OCR output, missing fields, and various invoice formats gracefully.
If a field cannot be determined, use null.
Always try to extract the total_amount even if other fields are unclear.
${formatHint}

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: "Extract all invoice data from this document. Return valid JSON only.",
              },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      if (aiResponse.status === 429) {
        await supabase
          .from("invoices")
          .update({ status: "failed", error_message: "Rate limited. Please try again later." })
          .eq("id", invoiceId);
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        await supabase
          .from("invoices")
          .update({ status: "failed", error_message: "AI credits exhausted." })
          .eq("id", invoiceId);
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch {
      await supabase
        .from("invoices")
        .update({
          status: "failed",
          error_message: "Failed to parse AI response as JSON",
          raw_extracted_text: content,
        })
        .eq("id", invoiceId);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vendorNormalized = extracted.vendor_name ? normalizeVendor(extracted.vendor_name) : null;
    const formatHash = computeFormatHash(extracted.raw_text || content);

    // Check for duplicate invoices
    let isDuplicate = false;
    let duplicateOf = null;
    if (extracted.invoice_number && vendorNormalized) {
      const { data: existing } = await supabase
        .from("invoices")
        .select("id")
        .eq("vendor_normalized", vendorNormalized)
        .eq("invoice_number", extracted.invoice_number)
        .neq("id", invoiceId)
        .eq("status", "completed")
        .limit(1);
      if (existing && existing.length > 0) {
        isDuplicate = true;
        duplicateOf = existing[0].id;
      }
    }

    // Update invoice with extracted data
    await supabase
      .from("invoices")
      .update({
        status: "completed",
        vendor_name: extracted.vendor_name,
        vendor_normalized: vendorNormalized,
        invoice_number: extracted.invoice_number,
        invoice_date: extracted.invoice_date,
        due_date: extracted.due_date,
        subtotal: extracted.subtotal,
        tax_amount: extracted.tax_amount,
        total_amount: extracted.total_amount,
        currency: extracted.currency || "USD",
        confidence_score: extracted.confidence_score,
        raw_extracted_text: extracted.raw_text || content,
        raw_extracted_json: extracted,
        format_hash: formatHash,
        is_duplicate: isDuplicate,
        duplicate_of: duplicateOf,
      })
      .eq("id", invoiceId);

    // Insert line items
    if (extracted.line_items && Array.isArray(extracted.line_items) && extracted.line_items.length > 0) {
      const lineItems = extracted.line_items.map((item: any) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));
      await supabase.from("invoice_line_items").insert(lineItems);
    }

    // Update or create format template
    const { data: existingFormat } = await supabase
      .from("invoice_formats")
      .select("*")
      .eq("format_hash", formatHash)
      .single();

    if (existingFormat) {
      const newAvg =
        ((existingFormat.avg_confidence || 0) * (existingFormat.times_seen || 1) +
          (extracted.confidence_score || 0)) /
        ((existingFormat.times_seen || 1) + 1);
      await supabase
        .from("invoice_formats")
        .update({
          times_seen: (existingFormat.times_seen || 1) + 1,
          avg_confidence: newAvg,
        })
        .eq("id", existingFormat.id);
    } else {
      await supabase.from("invoice_formats").insert({
        format_hash: formatHash,
        vendor_name: extracted.vendor_name,
        field_mapping: {
          has_line_items: extracted.line_items?.length > 0,
          has_tax: extracted.tax_amount != null,
          currency: extracted.currency,
        },
        avg_confidence: extracted.confidence_score,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_id: invoiceId,
        vendor: extracted.vendor_name,
        total: extracted.total_amount,
        confidence: extracted.confidence_score,
        is_duplicate: isDuplicate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-invoice error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
