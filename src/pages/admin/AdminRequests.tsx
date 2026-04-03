import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList } from "lucide-react";

export default function AdminRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("pendiente");

  const load = async () => {
    let q = supabase.from("requests").select("*, request_types(name), profiles(full_name), vehicles(license_plate)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q.limit(50);
    setRequests(data || []);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Estado actualizado a ${status}` }); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-xl font-bold">Solicitudes</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-3 opacity-40" />
            <p>No hay solicitudes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {requests.map((req: any) => (
            <Card key={req.id} className="stat-card">
              <CardContent className="flex items-center gap-4 p-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium text-sm">{req.request_types?.name}</p>
                  <p className="text-xs text-muted-foreground">{req.profiles?.full_name} • {req.vehicles?.license_plate || "Sin vehículo"}</p>
                  <p className="text-xs text-muted-foreground truncate">{req.details}</p>
                  {req.amount && <p className="text-xs text-muted-foreground">Monto: ${Number(req.amount).toLocaleString("es-CL")}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("es-CL")}</p>
                </div>
                <Badge variant="outline" className={`status-badge-${req.status}`}>{req.status}</Badge>
                <div className="flex gap-1">
                  {req.status !== "en_proceso" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(req.id, "en_proceso")}>En Proceso</Button>
                  )}
                  {req.status !== "completado" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(req.id, "completado")}>Completar</Button>
                  )}
                  {req.status !== "pendiente" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(req.id, "pendiente")}>Pendiente</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
