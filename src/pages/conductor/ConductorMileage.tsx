import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Gauge } from "lucide-react";

export default function ConductorMileage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!profile) return;
    const [rRes, vRes] = await Promise.all([
      supabase.from("mileage_records").select("*, vehicles(license_plate)").eq("profile_id", profile.id).order("recorded_date", { ascending: false }),
      supabase.from("vehicle_assignments").select("vehicles(id, license_plate)").eq("profile_id", profile.id),
    ]);
    setRecords(rRes.data || []);
    setVehicles((vRes.data || []).map((va: any) => va.vehicles));
  };

  useEffect(() => { load(); }, [profile]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("mileage_records").insert({
      profile_id: profile.id,
      vehicle_id: form.get("vehicle_id") as string,
      kilometers: parseInt(form.get("kilometers") as string),
      recorded_date: form.get("recorded_date") as string,
      notes: form.get("notes") as string,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kilometraje registrado" });
      setOpen(false);
      load();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-xl font-bold">Registro de Kilometraje</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Registrar Km</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Kilometraje</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Vehículo</Label>
                <Select name="vehicle_id" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.license_plate}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kilómetros</Label>
                <Input name="kilometers" type="number" required min={0} placeholder="Ej: 85000" />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input name="recorded_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input name="notes" placeholder="Observaciones" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Registrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Gauge className="h-12 w-12 mb-3 opacity-40" />
            <p>No hay registros de kilometraje.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {records.map((rec: any) => (
            <Card key={rec.id} className="stat-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Gauge className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{rec.kilometers.toLocaleString()} km</p>
                  <p className="text-xs text-muted-foreground">{rec.vehicles?.license_plate} • {new Date(rec.recorded_date).toLocaleDateString("es-CL")}</p>
                  {rec.notes && <p className="text-xs text-muted-foreground">{rec.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
