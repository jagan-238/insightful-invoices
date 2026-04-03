import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, FileText, X, Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface FileState {
  file: File;
  status: "idle" | "uploading" | "processing" | "done" | "error";
  invoiceId?: string;
  error?: string;
}

export default function Upload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileState[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter((f) =>
      ["image/jpeg", "image/png", "application/pdf"].includes(f.type)
    );
    if (accepted.length === 0) {
      toast({ title: "Invalid file type", description: "Please upload JPG, PNG, or PDF files.", variant: "destructive" });
      return;
    }
    setFiles((prev) => [...prev, ...accepted.map((file) => ({ file, status: "idle" as const }))]);
  }, [toast]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFile = async (index: number) => {
    if (!user) return;

    const fileState = files[index];
    const file = fileState.file;
    const fileType = file.type.includes("pdf") ? "pdf" : file.type.includes("png") ? "png" : "jpg";
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f)));

    try {
      // Upload to storage
      const { error: uploadErr } = await supabase.storage.from("invoices").upload(filePath, file);
      if (uploadErr) throw uploadErr;

      // Create invoice record
      const { data: invoice, error: insertErr } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: fileType,
          status: "pending",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "processing", invoiceId: invoice.id } : f
        )
      );

      // Call edge function to process
      const { data, error: fnErr } = await supabase.functions.invoke("process-invoice", {
        body: { invoiceId: invoice.id },
      });

      if (fnErr) throw fnErr;

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "done" } : f))
      );

      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "error", error: err.message } : f
        )
      );
      toast({ title: "Processing failed", description: err.message, variant: "destructive" });
    }
  };

  const processAll = async () => {
    const idleIndexes = files.map((f, i) => (f.status === "idle" ? i : -1)).filter((i) => i >= 0);
    for (const index of idleIndexes) {
      await processFile(index);
    }
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasIdle = files.some((f) => f.status === "idle");
  const isProcessing = files.some((f) => f.status === "uploading" || f.status === "processing");

  return (
    <AppLayout title="Upload Invoices">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-accent" : "border-border hover:border-primary/40"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".jpg,.jpeg,.png,.pdf";
          input.onchange = () => input.files && addFiles(input.files);
          input.click();
        }}
      >
        <UploadIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium mb-1">
          Drop invoices here or click to browse
        </p>
        <p className="text-sm text-muted-foreground">
          Supports JPG, PNG, and PDF files
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="stat-card flex items-center gap-3 p-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">
                  {f.file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(f.file.size / 1024).toFixed(0)} KB
                  {f.error && ` · ${f.error}`}
                </span>
              </div>
              {f.status === "idle" && (
                <Button size="icon" variant="ghost" onClick={() => removeFile(i)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              {(f.status === "uploading" || f.status === "processing") && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {f.status === "done" && <CheckCircle className="h-4 w-4 text-success" />}
              {f.status === "error" && (
                <Button size="sm" variant="outline" onClick={() => processFile(i)}>
                  Retry
                </Button>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            {hasIdle && (
              <Button onClick={processAll} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process ${files.filter((f) => f.status === "idle").length} file(s)`
                )}
              </Button>
            )}
            {allDone && (
              <Button onClick={() => navigate("/dashboard")}>View Dashboard</Button>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
