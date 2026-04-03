import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";

const COLORS = ["hsl(172, 66%, 40%)", "hsl(210, 100%, 52%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(152, 60%, 42%)", "hsl(280, 60%, 50%)"];

export default function Analytics() {
  const { user } = useAuth();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices-analytics", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("status", "completed")
        .order("invoice_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <AppLayout title="Analytics">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (invoices.length === 0) {
    return (
      <AppLayout title="Analytics">
        <div className="stat-card text-center py-16">
          <p className="text-muted-foreground">Process some invoices to see analytics.</p>
        </div>
      </AppLayout>
    );
  }

  // Vendor spend
  const vendorMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    const name = inv.vendor_name || "Unknown";
    vendorMap[name] = (vendorMap[name] || 0) + (inv.total_amount || 0);
  });
  const vendorData = Object.entries(vendorMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Monthly spend
  const monthMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    if (inv.invoice_date) {
      const month = format(startOfMonth(parseISO(inv.invoice_date)), "MMM yyyy");
      monthMap[month] = (monthMap[month] || 0) + (inv.total_amount || 0);
    }
  });
  const monthlyData = Object.entries(monthMap).map(([month, total]) => ({ month, total }));

  // Currency breakdown
  const currencyMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    const cur = inv.currency || "USD";
    currencyMap[cur] = (currencyMap[cur] || 0) + (inv.total_amount || 0);
  });
  const currencyData = Object.entries(currencyMap).map(([currency, total]) => ({
    name: currency,
    value: total,
  }));

  return (
    <AppLayout title="Analytics">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Invoices Processed</span>
          <p className="text-2xl font-semibold text-foreground mt-1">{invoices.length}</p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Total Spend</span>
          <p className="text-2xl font-semibold text-foreground mt-1">
            ${invoices.reduce((s, i) => s + (i.total_amount || 0), 0).toLocaleString("en", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="stat-card">
          <span className="text-xs text-muted-foreground">Unique Vendors</span>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {new Set(invoices.map((i) => i.vendor_normalized).filter(Boolean)).size}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Vendor spend */}
        <div className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Spend by Vendor</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={vendorData} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={80}
              />
              <Tooltip
                formatter={(val: number) => [`$${val.toLocaleString("en", { minimumFractionDigits: 2 })}`, "Spend"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="total" fill="hsl(172, 66%, 40%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trend */}
        <div className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Monthly Spend Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                formatter={(val: number) => [`$${val.toLocaleString("en", { minimumFractionDigits: 2 })}`, "Spend"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="total" stroke="hsl(172, 66%, 40%)" strokeWidth={2} dot={{ fill: "hsl(172, 66%, 40%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Currency breakdown */}
        <div className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Currency Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={currencyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {currencyData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`$${val.toLocaleString("en", { minimumFractionDigits: 2 })}`, "Total"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vendor grouping */}
        <div className="stat-card">
          <h3 className="text-sm font-medium text-foreground mb-4">Invoices by Vendor</h3>
          <div className="space-y-2 max-h-[260px] overflow-y-auto">
            {Object.entries(vendorMap)
              .sort(([, a], [, b]) => b - a)
              .map(([name, total]) => {
                const count = invoices.filter((i) => (i.vendor_name || "Unknown") === name).length;
                return (
                  <div key={name} className="flex items-center justify-between py-1.5">
                    <div>
                      <span className="text-sm text-foreground">{name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{count} invoice{count > 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground font-mono">
                      ${total.toLocaleString("en", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
