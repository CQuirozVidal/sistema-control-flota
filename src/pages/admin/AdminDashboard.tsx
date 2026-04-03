import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Truck, Users, ClipboardList, FileText, AlertTriangle, Search } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ vehicles: 0, conductors: 0, pendingRequests: 0, expiringDocs: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [vRes, cRes, rRes, dRes] = await Promise.all([
        supabase.from("vehicles").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "conductor"),
        supabase.from("requests").select("*, request_types(name), profiles(full_name)").eq("status", "pendiente").order("created_at", { ascending: false }).limit(10),
        supabase.from("documents").select("id", { count: "exact" }).lte("expiration_date", thirtyDays).gte("expiration_date", now.toISOString().slice(0, 10)),
      ]);

      setStats({
        vehicles: vRes.count || 0,
        conductors: cRes.count || 0,
        pendingRequests: (rRes.data || []).length,
        expiringDocs: dRes.count || 0,
      });
      setRecentRequests(rRes.data || []);
    };
    load();
  }, []);

  const statCards = [
    { icon: Truck, label: "Vehículos", value: stats.vehicles, color: "text-primary" },
    { icon: Users, label: "Conductores", value: stats.conductors, color: "text-accent" },
    { icon: ClipboardList, label: "Solicitudes Pendientes", value: stats.pendingRequests, color: "text-warning" },
    { icon: FileText, label: "Docs por Vencer (30d)", value: stats.expiringDocs, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {(stats.pendingRequests > 0 || stats.expiringDocs > 0) && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm font-medium">Existen tareas pendientes: {stats.pendingRequests} solicitudes y {stats.expiringDocs} documentos por vencer.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="stat-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold font-heading">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/admin/search" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Buscar por Patente</span>
            </Link>
            <Link to="/admin/requests" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
              <ClipboardList className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">Ver Solicitudes</span>
            </Link>
            <Link to="/admin/messages" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors">
              <FileText className="h-5 w-5 text-accent" />
              <span className="text-sm font-medium">Enviar Mensaje</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.slice(0, 5).map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{req.request_types?.name}</p>
                      <p className="text-xs text-muted-foreground">{req.profiles?.full_name} • {new Date(req.created_at).toLocaleDateString("es-CL")}</p>
                    </div>
                    <Badge variant="outline" className="status-badge-pendiente">pendiente</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
