import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { Plus, Truck, Users, Settings } from "lucide-react";

/**
 * AdminVehicles — Gestión de flota completa.
 * El admin puede crear vehículos y asignarlos a conductores.
 */
export default function AdminVehicles() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [conductors, setConductors] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const [vRes, cRes, aRes] = await Promise.all([
      supabase.from("vehicles").select("*").order("license_plate"),
      supabase.from("profiles").select("id, full_name, email").eq("role", "conductor").order("full_name"),
      supabase.from("vehicle_assignments").select("*, profiles(full_name), vehicles(license_plate)").order("assigned_at", { ascending: false }),
    ]);
    setVehicles(vRes.data || []);
    setConductors(cRes.data || []);
    setAssignments(aRes.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("vehicles").insert({
      license_plate: (form.get("license_plate") as string).toUpperCase().trim(),
      make: (form.get("make") as string).trim(),
      model: (form.get("model") as string).trim(),
      year: parseInt(form.get("year") as string) || null,
      color: (form.get("color") as string).trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vehículo creado exitosamente" });
      setOpenCreate(false);
      load();
    }
    setLoading(false);
  };

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("vehicle_assignments").insert({
      vehicle_id: selectedVehicle.id,
      profile_id: form.get("profile_id") as string,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Ya asignado", description: "Este conductor ya está asignado a este vehículo.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Conductor asignado exitosamente" });
      setOpenAssign(false);
      load();
    }
    setLoading(false);
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!confirm("¿Desasignar este conductor?")) return;
    await supabase.from("vehicle_assignments").delete().eq("id", id);
    toast({ title: "Asignación eliminada" });
    load();
  };

  const getAssignments = (vehicleId: string) => assignments.filter((a) => a.vehicle_id === vehicleId);

  const filtered = filter === "all" ? vehicles : vehicles.filter((v) => v.status === filter);

  const statusColor = (s: string) => {
    if (s === "active") return "bg-accent/10 text-accent border-accent/20";
    if (s === "maintenance") return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div>
      <PageHeader title="Gestión de Vehículos" description={`${vehicles.length} vehículos en flota`}>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="maintenance">Mantención</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Agregar Vehículo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Agregar Vehículo</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div className="space-y-2">
                <Label>Placa Patente *</Label>
                <Input name="license_plate" required placeholder="ABCD-12" maxLength={10} className="uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Input name="make" required placeholder="Toyota" />
                </div>
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input name="model" required placeholder="Hiace" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input name="year" type="number" min={2000} max={2030} placeholder="2023" />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input name="color" placeholder="Blanco" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear Vehículo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => {
          const vAssignments = getAssignments(v.id);
          return (
            <Card key={v.id} className="stat-card overflow-hidden">
              <div className="bg-muted/50 border-b px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-heading font-bold tracking-wider">{v.license_plate}</p>
                    <p className="text-xs text-muted-foreground">{v.make} {v.model} {v.year}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusColor(v.status)}`}>
                  {v.status === "active" ? "Activo" : v.status === "maintenance" ? "Mantención" : "Inactivo"}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Users className="h-3 w-3" /> Conductores asignados ({vAssignments.length})
                  </p>
                  {vAssignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin asignaciones</p>
                  ) : (
                    <div className="space-y-1">
                      {vAssignments.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between text-sm">
                          <span>{a.profiles?.full_name}</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={() => handleRemoveAssignment(a.id)}>
                            Quitar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => { setSelectedVehicle(v); setOpenAssign(true); }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Asignar Conductor
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog asignar conductor */}
      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Asignar Conductor a {selectedVehicle?.license_plate}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label>Conductor *</Label>
              <Select name="profile_id" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar conductor" /></SelectTrigger>
                <SelectContent>
                  {conductors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Asignando..." : "Asignar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
