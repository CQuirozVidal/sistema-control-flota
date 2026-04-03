import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Truck, LayoutDashboard, FileText, ClipboardList, Gauge, MessageSquare,
  Search, LogOut, Menu, X, ChevronRight, User
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/search", icon: Search, label: "Buscar Patente" },
  { to: "/admin/requests", icon: ClipboardList, label: "Solicitudes" },
  { to: "/admin/messages", icon: MessageSquare, label: "Mensajes" },
];

const conductorLinks = [
  { to: "/conductor", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/conductor/vehicles", icon: Truck, label: "Vehículos" },
  { to: "/conductor/documents", icon: FileText, label: "Documentos" },
  { to: "/conductor/requests", icon: ClipboardList, label: "Solicitudes" },
  { to: "/conductor/mileage", icon: Gauge, label: "Kilometraje" },
  { to: "/conductor/messages", icon: MessageSquare, label: "Mensajes" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = isAdmin ? adminLinks : conductorLinks;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Truck className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-sidebar-primary-foreground">FlotaControl</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{profile?.full_name || "Usuario"}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{profile?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-lg font-semibold">
            {links.find((l) => l.to === location.pathname)?.label || "FlotaControl"}
          </h1>
        </header>
        <div className="page-container animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
