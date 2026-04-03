import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Upload, BarChart3, LogOut, Menu } from "lucide-react";
import { useState } from "react";

export default function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: FileText, path: "/dashboard" },
    { label: "Upload", icon: Upload, path: "/upload" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-14 items-center px-4 md:px-6">
          <button
            className="mr-3 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer mr-8"
            onClick={() => navigate("/dashboard")}
          >
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">InvoiceAI</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-4 w-4 mr-1.5" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border p-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        )}
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {title && (
          <h1 className="text-2xl font-semibold text-foreground mb-6">{title}</h1>
        )}
        {children}
      </main>
    </div>
  );
}
