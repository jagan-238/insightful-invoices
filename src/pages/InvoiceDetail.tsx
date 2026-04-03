import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calendar, Hash, DollarSign, AlertTriangle } from "lucide-react";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["line-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Invoice not found.</p>
      </AppLayout>
    );
  }

  const fields = [
    { label: "Invoice Number", value: invoice.invoice_number, icon: Hash },
    { label: "Invoice Date", value: invoice.invoice_date, icon: Calendar },
    { label: "Due Date", value: invoice.due_date, icon: Calendar },
    { label: "Subtotal", value: invoice.subtotal != null ? `${invoice.currency} ${invoice.subtotal}` : null, icon: DollarSign },
    { label: "Tax", value: invoice.tax_amount != null ? `${invoice.currency} ${invoice.tax_amount}` : null, icon: DollarSign },
    { label: "Total", value: invoice.total_amount != null ? `${invoice.currency} ${invoice.total_amount}` : null, icon: DollarSign },
  ];

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/dashboard")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {invoice.vendor_name || invoice.file_name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className={
                invoice.status === "completed"
                  ? "border-success/30 text-success"
                  : invoice.status === "failed"
                  ? "border-destructive/30 text-destructive"
                  : "border-warning/30 text-warning"
              }
            >
              {invoice.status}
            </Badge>
            {invoice.confidence_score != null && (
              <span className="text-xs text-muted-foreground">
                {(invoice.confidence_score * 100).toFixed(0)}% confidence
              </span>
            )}
            {invoice.is_duplicate && (
              <Badge variant="outline" className="border-warning/30 text-warning">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Possible duplicate
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {fields.map(
          (f) =>
            f.value && (
              <div key={f.label} className="stat-card p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <f.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{f.value}</span>
              </div>
            )
        )}
      </div>

      {/* Line items */}
      {lineItems.length > 0 && (
        <div className="stat-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-foreground text-sm">Line Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 text-muted-foreground font-medium">Description</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Qty</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Unit Price</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-foreground">{item.description}</td>
                    <td className="p-3 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {item.unit_price?.toLocaleString("en", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {item.amount?.toLocaleString("en", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error message */}
      {invoice.error_message && (
        <div className="stat-card p-4 mt-4 border-destructive/30">
          <p className="text-sm text-destructive">{invoice.error_message}</p>
        </div>
      )}

      {/* Raw JSON */}
      {invoice.raw_extracted_json && (
        <details className="mt-4">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            View raw extracted data
          </summary>
          <pre className="mt-2 p-4 rounded-lg bg-muted text-xs text-muted-foreground overflow-x-auto font-mono">
            {JSON.stringify(invoice.raw_extracted_json, null, 2)}
          </pre>
        </details>
      )}
    </AppLayout>
  );
}
