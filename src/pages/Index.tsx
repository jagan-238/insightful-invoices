import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FileText, Upload, BarChart3, Zap, Shield, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Upload,
      title: "Multi-Format Upload",
      desc: "Drop JPG, PNG, or PDF invoices. Batch processing supported.",
    },
    {
      icon: Zap,
      title: "AI-Powered Extraction",
      desc: "Gemini vision extracts vendor, amounts, dates, and line items automatically.",
    },
    {
      icon: Shield,
      title: "Smart Validation",
      desc: "Confidence scoring, duplicate detection, and format learning.",
    },
    {
      icon: BarChart3,
      title: "Spend Analytics",
      desc: "Track spending by vendor, month, and currency with interactive charts.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">InvoiceAI</span>
          </div>
          <Button size="sm" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground mb-6">
          <Zap className="h-3 w-3" />
          Powered by AI
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
          Extract invoice data
          <br />
          <span className="text-primary">in seconds, not hours</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
          Upload invoices in any format. Our AI reads, validates, and structures your data —
          then gives you analytics to track spending.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Start Extracting
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
            View Demo
          </Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="stat-card">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-medium text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
