import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import {
  Truck, Users, ClipboardList, FileText, AlertTriangle,
  Search, MessageSquare, ArrowRight, TrendingUp, Wrench
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    vehicles: 0, activeVehicles: 0, conductors: 0,
    pendingRequests: 0, inProcessRequests: 0,
    expiringDocs: 0, totalDocs: 0, unreadMessages: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
      const today = now.toISOString().slice(0, 10);

      const [vRes, vActiveRes, cRes, rPendRes, rProcRes, dExpRes, dTotalRes, msgRes, rRecentRes, dExpListRes] = await Promise.all([
        supabase.from("vehicles").select("id", { count: "exact" }),
        supabase.from("vehicles").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact" }).eq("role", "conductor"),
        supabase.from("requests").select("id", { count: "exact" }).eq("status", "pendiente"),
        supabase.from("requests").select("id", { count: "exact" }).eq("status", "en_proceso"),
        supabase.from("documents").select("id", { count: "exact" }).lte("expiration_date", thirtyDays).gte("expiration_date", today),
        supabase.from("documents").select("id", { count: "exact" }),
        supabase.from("messages").select("id", { count: "exact" }).eq("status", "pendiente"),
        supabase.from("requests").select("*, request_types(name), profiles(full_name), vehicles(license_plate)").in("status", ["pendiente", "en_proceso"]).order("created_at", { ascending: false }).limit(6),
        supabase.from("documents").select("*, document_types(name), profiles(full_name), vehicles(license_plate)").lte("expiration_date", thirtyDays).gte("expiration_date", today).order("expiration_date", { ascending: true }).limit(5),
      ]);

      setStats({
        vehicles: vRes.count || 0,
        activeVehicles: vActiveRes.count || 0,
        conductors: cRes.count || 0,
        pendingRequests: rPendRes.count || 0,
        inProcessRequests: rProcRes.count || 0,
        expiringDocs: dExpRes.count || 0,
        totalDocs: dTotalRes.count || 0,
        unreadMessages: msgRes.count || 0,
      });
      setRecentRequests(rRecentRes.data || []);
      setExpiringDocs(dExpListRes.data || []);
    };
    load();
  }, []);

  const hasPending = stats.pendingRequests > 0 || stats.expiringDocs > 0 || stats.unreadMessages > 0;

  return (
    <div className="space-y-6">
      {/* Alerta global */}
      {hasPending && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Existen tareas pendientes</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingRequests > 0 && `${stats.pendingRequests} solicitud(es) pendiente(s). `}
              {stats.inProcessRequests > 0 && `${stats.inProcessRequests} en proceso. `}
              {stats.expiringDocs > 0 && `${stats.expiringDocs} documento(s) por vencer. `}
              {stats.unreadMessages > 0 && `${stats.unreadMessages} mensaje(s) pendiente(s).`}
            </p>
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Truck, label: "Flota Total", value: `${stats.activeVehicles}/${stats.vehicles}`, sub: "activos", color: "bg-primary/10 text-primary" },
          { icon: Users, label: "Conductores", value: stats.conductors, sub: "registrados", color: "bg-accent/10 text-accent" },
          { icon: ClipboardList, label: "Solicitudes", value: stats.pendingRequests, sub: "pendientes", color: "bg-warning/10 text-warning" },
          { icon: FileText, label: "Docs por Vencer", value: stats.expiringDocs, sub: "en 30 días", color: "bg-destructive/10 text-destructive" },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label} className="stat-card">
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold font-heading">{value}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accesos rápidos + Solicitudes pendientes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Accesos rápidos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Acceso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { to: "/admin/search", icon: Search, label: "Buscar por Patente", desc: "Info consolidada", color: "text-primary" },
              { to: "/admin/vehicles", icon: Truck, label: "Gestión de Vehículos", desc: `${stats.vehicles} en flota`, color: "text-accent" },
              { to: "/admin/requests", icon: ClipboardList, label: "Solicitudes", desc: `${stats.pendingRequests} pendientes`, color: "text-warning" },
              { to: "/admin/messages", icon: MessageSquare, label: "Mensajes", desc: `${stats.unreadMessages} sin respuesta`, color: "text-info" },
            ].map(({ to, icon: Icon, label, desc, color }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                <Icon className={`h-4 w-4 ${color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{label}</span>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Solicitudes recientes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-heading text-base">Solicitudes Activas</CardTitle>
            <Link to="/admin/requests" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay solicitudes activas.</p>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{req.request_types?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.profiles?.full_name} {req.vehicles?.license_plate ? `• ${req.vehicles.license_plate}` : ""}
                        {" • "}{new Date(req.created_at).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documentos por vencer */}
      {expiringDocs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Documentos Próximos a Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringDocs.map((doc: any) => {
                const daysLeft = Math.ceil((new Date(doc.expiration_date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{doc.document_types?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.profiles?.full_name} {doc.vehicles?.license_plate ? `• ${doc.vehicles.license_plate}` : ""}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${daysLeft <= 7 ? "text-destructive" : "text-warning"}`}>
                      {daysLeft} día(s)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
