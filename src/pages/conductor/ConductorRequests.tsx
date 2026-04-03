import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardList } from "lucide-react";

export default function ConductorRequests() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [reqTypes, setReqTypes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!profile) return;
    const [rRes, tRes, vRes] = await Promise.all([
      supabase.from("requests").select("*, request_types(name), vehicles(license_plate)").eq("profile_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("request_types").select("*"),
      supabase.from("vehicle_assignments").select("vehicles(id, license_plate)").eq("profile_id", profile.id),
    ]);
    setRequests(rRes.data || []);
    setReqTypes(tRes.data || []);
    setVehicles((vRes.data || []).map((va: any) => va.vehicles));
  };

  useEffect(() => { load(); }, [profile]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const vehicleId = form.get("vehicle_id") as string;
    const { error } = await supabase.from("requests").insert({
      profile_id: profile.id,
      request_type_id: form.get("request_type_id") as string,
      vehicle_id: vehicleId === "none" ? null : vehicleId,
      details: form.get("details") as string,
      amount: parseFloat(form.get("amount") as string) || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Solicitud creada" });
      setOpen(false);
      load();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-xl font-bold">Mis Solicitudes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nueva Solicitud</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Solicitud</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="request_type_id" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {reqTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehículo (opcional)</Label>
                <Select name="vehicle_id">
                  <SelectTrigger><SelectValue placeholder="Sin vehículo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vehículo</SelectItem>
                    {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.license_plate}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto (opcional)</Label>
                <Input name="amount" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Detalles</Label>
                <Textarea name="details" placeholder="Describe tu solicitud" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear Solicitud"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{req.request_types?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{req.details || "Sin detalles"}</p>
                  {req.vehicles?.license_plate && <p className="text-xs text-muted-foreground">Vehículo: {req.vehicles.license_plate}</p>}
                  {req.amount && <p className="text-xs text-muted-foreground">Monto: ${Number(req.amount).toLocaleString("es-CL")}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("es-CL")}</p>
                </div>
                <Badge variant="outline" className={`status-badge-${req.status}`}>{req.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
