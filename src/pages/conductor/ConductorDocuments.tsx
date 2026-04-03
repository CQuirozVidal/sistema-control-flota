import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Trash2 } from "lucide-react";

export default function ConductorDocuments() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    if (!profile) return;
    const [docsRes, typesRes, vehRes] = await Promise.all([
      supabase.from("documents").select("*, document_types(name), vehicles(license_plate)").eq("profile_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("document_types").select("*"),
      supabase.from("vehicle_assignments").select("vehicle_id, vehicles(id, license_plate)").eq("profile_id", profile.id),
    ]);
    setDocuments(docsRes.data || []);
    setDocTypes(typesRes.data || []);
    setVehicles((vehRes.data || []).map((va: any) => va.vehicles));
  };

  useEffect(() => { load(); }, [profile]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !user) return;
    setUploading(true);
    const form = new FormData(e.currentTarget);
    const file = form.get("file") as File;
    const fileKey = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage.from("documents").upload(fileKey, file);
    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileKey);
    const vehicleId = form.get("vehicle_id") as string;

    const { error } = await supabase.from("documents").insert({
      profile_id: profile.id,
      document_type_id: form.get("document_type_id") as string,
      vehicle_id: vehicleId === "none" ? null : vehicleId,
      file_url: urlData.publicUrl,
      file_key: fileKey,
      description: form.get("description") as string,
      expiration_date: (form.get("expiration_date") as string) || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Documento subido exitosamente" });
      setOpen(false);
      load();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, fileKey: string) => {
    await supabase.storage.from("documents").remove([fileKey]);
    await supabase.from("documents").delete().eq("id", id);
    toast({ title: "Documento eliminado" });
    load();
  };

  const filtered = filter === "all" ? documents : documents.filter((d: any) => d.document_types?.name === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-xl font-bold">Mis Documentos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Subir Documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Subir Documento</DialogTitle></DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select name="document_type_id" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {docTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
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
                <Label>Descripción</Label>
                <Input name="description" placeholder="Descripción breve" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de vencimiento</Label>
                <Input name="expiration_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label>Archivo</Label>
                <Input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Subiendo..." : "Subir"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("all")}>Todos</Badge>
        {docTypes.map((t) => (
          <Badge key={t.id} variant={filter === t.name ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter(t.name)}>{t.name}</Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-40" />
            <p>No hay documentos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc: any) => (
            <Card key={doc.id} className="stat-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.document_types?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{doc.description || "Sin descripción"}</p>
                  {doc.vehicles?.license_plate && <p className="text-xs text-muted-foreground">Vehículo: {doc.vehicles.license_plate}</p>}
                  {doc.expiration_date && <p className="text-xs text-muted-foreground">Vence: {new Date(doc.expiration_date).toLocaleDateString("es-CL")}</p>}
                </div>
                <Badge variant="outline" className={`status-badge-${doc.status}`}>{doc.status}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={doc.file_url} target="_blank" rel="noreferrer"><FileText className="h-4 w-4" /></a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.file_key)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
