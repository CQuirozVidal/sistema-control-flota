import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Truck, User, FileText, ClipboardList, Gauge, StickyNote, Plus } from "lucide-react";

export default function AdminSearch() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [plate, setPlate] = useState("");
  const [vehicle, setVehicle] = useState<any>(null);
  const [conductor, setConductor] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [mileage, setMileage] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);

  const handleSearch = async () => {
    if (!plate.trim()) return;
    setSearching(true);
    setFound(false);

    const { data: veh } = await supabase.from("vehicles").select("*").eq("license_plate", plate.trim().toUpperCase()).single();
    if (!veh) {
      toast({ title: "No encontrado", description: "No existe un vehículo con esa patente.", variant: "destructive" });
      setSearching(false);
      return;
    }

    setVehicle(veh);

    const [assignRes, docsRes, reqsRes, milRes, notesRes] = await Promise.all([
      supabase.from("vehicle_assignments").select("profiles(*)").eq("vehicle_id", veh.id).limit(1),
      supabase.from("documents").select("*, document_types(name)").eq("vehicle_id", veh.id).order("created_at", { ascending: false }),
      supabase.from("requests").select("*, request_types(name), profiles(full_name)").eq("vehicle_id", veh.id).order("created_at", { ascending: false }),
      supabase.from("mileage_records").select("*, profiles(full_name)").eq("vehicle_id", veh.id).order("recorded_date", { ascending: false }),
      supabase.from("admin_notes").select("*").eq("vehicle_id", veh.id).order("created_at", { ascending: false }),
    ]);

    setConductor((assignRes.data || [])[0]?.profiles || null);
    setDocuments(docsRes.data || []);
    setRequests(reqsRes.data || []);
    setMileage(milRes.data || []);
    setNotes(notesRes.data || []);
    setFound(true);
    setSearching(false);
  };

  const addNote = async () => {
    if (!newNote.trim() || !vehicle || !profile) return;
    const { error } = await supabase.from("admin_notes").insert({
      vehicle_id: vehicle.id,
      admin_id: profile.id,
      note_text: newNote.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nota agregada" });
      setNewNote("");
      const { data } = await supabase.from("admin_notes").select("*").eq("vehicle_id", vehicle.id).order("created_at", { ascending: false });
      setNotes(data || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <Label>Buscar por Placa Patente</Label>
          <Input
            placeholder="Ej: ABCD12"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={searching}>
          <Search className="mr-2 h-4 w-4" />
          {searching ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {found && vehicle && (
        <Tabs defaultValue="info" className="animate-fade-in">
          <TabsList className="flex-wrap">
            <TabsTrigger value="info"><Truck className="mr-1 h-4 w-4" />Info</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="mr-1 h-4 w-4" />Documentos ({documents.length})</TabsTrigger>
            <TabsTrigger value="requests"><ClipboardList className="mr-1 h-4 w-4" />Solicitudes ({requests.length})</TabsTrigger>
            <TabsTrigger value="mileage"><Gauge className="mr-1 h-4 w-4" />Km ({mileage.length})</TabsTrigger>
            <TabsTrigger value="notes"><StickyNote className="mr-1 h-4 w-4" />Notas ({notes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />Vehículo</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Patente:</span> {vehicle.license_plate}</p>
                  <p><span className="text-muted-foreground">Marca:</span> {vehicle.make}</p>
                  <p><span className="text-muted-foreground">Modelo:</span> {vehicle.model}</p>
                  <p><span className="text-muted-foreground">Año:</span> {vehicle.year}</p>
                  <p><span className="text-muted-foreground">Color:</span> {vehicle.color}</p>
                  <p><span className="text-muted-foreground">Estado:</span> {vehicle.status}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><User className="h-4 w-4 text-accent" />Conductor</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {conductor ? (
                    <>
                      <p><span className="text-muted-foreground">Nombre:</span> {conductor.full_name}</p>
                      <p><span className="text-muted-foreground">Email:</span> {conductor.email}</p>
                      <p><span className="text-muted-foreground">Teléfono:</span> {conductor.phone || "—"}</p>
                    </>
                  ) : <p className="text-muted-foreground">Sin conductor asignado</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-3">
            {documents.length === 0 ? <p className="text-sm text-muted-foreground">Sin documentos.</p> : documents.map((doc: any) => (
              <Card key={doc.id} className="stat-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{doc.document_types?.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                    {doc.expiration_date && <p className="text-xs text-muted-foreground">Vence: {new Date(doc.expiration_date).toLocaleDateString("es-CL")}</p>}
                  </div>
                  <Badge variant="outline" className={`status-badge-${doc.status}`}>{doc.status}</Badge>
                  <Button variant="ghost" size="sm" asChild><a href={doc.file_url} target="_blank" rel="noreferrer">Ver</a></Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-3">
            {requests.length === 0 ? <p className="text-sm text-muted-foreground">Sin solicitudes.</p> : requests.map((req: any) => (
              <Card key={req.id} className="stat-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{req.request_types?.name}</p>
                    <p className="text-xs text-muted-foreground">{req.profiles?.full_name} • {req.details}</p>
                    {req.amount && <p className="text-xs text-muted-foreground">Monto: ${Number(req.amount).toLocaleString("es-CL")}</p>}
                  </div>
                  <Badge variant="outline" className={`status-badge-${req.status}`}>{req.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="mileage" className="mt-4 space-y-3">
            {mileage.length === 0 ? <p className="text-sm text-muted-foreground">Sin registros.</p> : mileage.map((m: any) => (
              <Card key={m.id} className="stat-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <Gauge className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{m.kilometers.toLocaleString()} km</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.recorded_date).toLocaleDateString("es-CL")} • {m.profiles?.full_name}</p>
                    {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="notes" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Escribir nota privada..." className="flex-1" />
              <Button onClick={addNote} disabled={!newNote.trim()} size="icon" className="shrink-0 self-end">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {notes.length === 0 ? <p className="text-sm text-muted-foreground">Sin notas.</p> : notes.map((n: any) => (
              <Card key={n.id} className="stat-card">
                <CardContent className="p-4">
                  <p className="text-sm">{n.note_text}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString("es-CL")}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
