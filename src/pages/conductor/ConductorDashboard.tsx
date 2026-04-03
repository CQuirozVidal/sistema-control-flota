import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, FileText, ClipboardList, AlertTriangle, Gauge } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConductorDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ vehicles: 0, documents: 0, requests: 0, pendingMessages: 0, lastMileage: 0 });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const [vRes, dRes, rRes, mRes, msgRes] = await Promise.all([
        supabase.from("vehicle_assignments").select("id", { count: "exact" }).eq("profile_id", profile.id),
        supabase.from("documents").select("id", { count: "exact" }).eq("profile_id", profile.id),
        supabase.from("requests").select("*, request_types(name)").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("mileage_records").select("kilometers").eq("profile_id", profile.id).order("recorded_date", { ascending: false }).limit(1),
        supabase.from("messages").select("id", { count: "exact" }).eq("receiver_id", profile.id).eq("status", "pendiente"),
      ]);

      const pendingReqs = (rRes.data || []).filter((r: any) => r.status === "pendiente");
      setPendingRequests(rRes.data || []);
      setHasPending(pendingReqs.length > 0 || (msgRes.count || 0) > 0);
      setStats({
        vehicles: vRes.count || 0,
        documents: dRes.count || 0,
        requests: (rRes.data || []).length,
        pendingMessages: msgRes.count || 0,
        lastMileage: mRes.data?.[0]?.kilometers || 0,
      });
    };
    load();
  }, [profile]);

  const statCards = [
    { icon: Truck, label: "Vehículos", value: stats.vehicles, to: "/conductor/vehicles", color: "text-primary" },
    { icon: FileText, label: "Documentos", value: stats.documents, to: "/conductor/documents", color: "text-accent" },
    { icon: ClipboardList, label: "Solicitudes", value: stats.requests, to: "/conductor/requests", color: "text-warning" },
    { icon: Gauge, label: "Último Km", value: stats.lastMileage.toLocaleString(), to: "/conductor/mileage", color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {hasPending && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm font-medium">Existen tareas pendientes</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value, to, color }) => (
          <Link key={label} to={to}>
            <Card className="stat-card group cursor-pointer">
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
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Solicitudes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes aún.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{req.request_types?.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("es-CL")}</p>
                  </div>
                  <Badge variant="outline" className={`status-badge-${req.status}`}>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
