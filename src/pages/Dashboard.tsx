import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { FileText, DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  processing: { icon: Clock, color: "bg-info/10 text-info", label: "Processing" },
  completed: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Completed" },
  failed: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Failed" },
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) return null;

  const completed = invoices.filter((i) => i.status === "completed");
  const totalSpend = completed.reduce((s, i) => s + (i.total_amount || 0), 0);
  const uniqueVendors = new Set(completed.map((i) => i.vendor_normalized).filter(Boolean)).size;
  const avgConfidence = completed.length
    ? completed.reduce((s, i) => s + (i.confidence_score || 0), 0) / completed.length
    : 0;

  const stats = [
    { label: "Total Invoices", value: invoices.length, icon: FileText },
    { label: "Total Spend", value: `$${totalSpend.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: DollarSign },
    { label: "Vendors", value: uniqueVendors, icon: TrendingUp },
    { label: "Avg Confidence", value: `${(avgConfidence * 100).toFixed(0)}%`, icon: AlertTriangle },
  ];

  return (
    <AppLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <span className="text-xl font-semibold text-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">Recent Invoices</h2>
        <Button size="sm" onClick={() => navigate("/upload")}>
          <Upload className="h-4 w-4 mr-1.5" />
          Upload
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="stat-card text-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">No invoices yet</p>
          <Button onClick={() => navigate("/upload")}>Upload your first invoice</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const config = statusConfig[inv.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <div
                key={inv.id}
                className="stat-card flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors p-4"
                onClick={() => navigate(`/invoice/${inv.id}`)}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.color}`}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {inv.vendor_name || inv.file_name}
                    </span>
                    {inv.is_duplicate && (
                      <Badge variant="outline" className="text-warning border-warning/30 text-xs">
                        Duplicate
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {inv.invoice_number ? `#${inv.invoice_number} · ` : ""}
                    {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-right">
                  {inv.total_amount != null && (
                    <span className="font-medium text-sm text-foreground">
                      {inv.currency} {inv.total_amount?.toLocaleString("en", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  {inv.confidence_score != null && (
                    <div className="text-xs text-muted-foreground">
                      {(inv.confidence_score * 100).toFixed(0)}% conf.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
