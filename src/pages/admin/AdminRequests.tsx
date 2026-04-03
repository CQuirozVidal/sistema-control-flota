import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import StatusBadge, { REQUEST_STATUSES } from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { ClipboardList } from "lucide-react";

/**
 * AdminRequests — Vista de solicitudes con filtro por estado y cambio de estado inline.
 * Soporta 5 estados: pendiente, en_proceso, aprobado, rechazado, completado.
 */
export default function AdminRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("pendiente");

  const load = async () => {
    let q = supabase.from("requests")
      .select("*, request_types(name), profiles(full_name), vehicles(license_plate)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRequests(data || []);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Estado actualizado a: ${status.replace("_", " ")}` }); load(); }
  };

  return (
    <div>
      <PageHeader title="Gestión de Solicitudes" description={`${requests.length} resultado(s)`}>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {requests.length === 0 ? (
        <Card><CardContent className="empty-state"><ClipboardList /><p>No hay solicitudes con este filtro.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((req: any) => (
            <Card key={req.id} className="stat-card">
              <CardContent className="flex items-center gap-4 p-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium text-sm">{req.request_types?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.profiles?.full_name}
                    {req.vehicles?.license_plate ? ` • ${req.vehicles.license_plate}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{req.details || "Sin detalles"}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    {req.amount && <span>💰 ${Number(req.amount).toLocaleString("es-CL")}</span>}
                    <span>{new Date(req.created_at).toLocaleDateString("es-CL")}</span>
                  </div>
                </div>
                <StatusBadge status={req.status} />
                {/* Selector rápido de estado */}
                <Select value={req.status} onValueChange={(v) => updateStatus(req.id, v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
