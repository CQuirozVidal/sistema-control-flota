import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { Plus, FileText, Trash2, Download, AlertCircle } from "lucide-react";

export default function ConductorDocuments() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    if (!profile) return;
    const [docsRes, typesRes, vehRes] = await Promise.all([
      supabase.from("documents").select("*, document_types(name), vehicles(license_plate)").eq("profile_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("document_types").select("*").order("name"),
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

    // Validación de archivo (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "El tamaño máximo es 10MB.", variant: "destructive" });
      setUploading(false);
      return;
    }

    const fileKey = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(fileKey, file);
    if (uploadError) {
      toast({ title: "Error al subir", description: uploadError.message, variant: "destructive" });
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
      toast({ title: "Documento subido correctamente" });
      setOpen(false);
      load();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, fileKey: string) => {
    if (!confirm("¿Estás seguro de eliminar este documento?")) return;
    await supabase.storage.from("documents").remove([fileKey]);
    await supabase.from("documents").delete().eq("id", id);
    toast({ title: "Documento eliminado" });
    load();
  };

  const filtered = documents.filter((d: any) => {
    if (filterType !== "all" && d.document_types?.name !== filterType) return false;
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    return true;
  });

  // Detectar documentos próximos a vencer
  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 86400000;
  };

  return (
    <div>
      <PageHeader title="Mis Documentos" description={`${documents.length} documento(s) en total`}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Subir Documento</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Subir Documento</DialogTitle></DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de documento *</Label>
                <Select name="document_type_id" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {docTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehículo asociado</Label>
                <Select name="vehicle_id" defaultValue="none">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vehículo</SelectItem>
                    {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.license_plate}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input name="description" placeholder="Ej: Liquidación marzo 2026" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de vencimiento</Label>
                <Input name="expiration_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label>Archivo * (máx. 10MB)</Label>
                <Input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Subiendo archivo..." : "Subir Documento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {docTypes.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="empty-state"><FileText /><p>No hay documentos con estos filtros.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc: any) => (
            <Card key={doc.id} className="stat-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{doc.document_types?.name}</p>
                    {isExpiringSoon(doc.expiration_date) && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-destructive">
                        <AlertCircle className="h-3 w-3" />Por vencer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{doc.description || "Sin descripción"}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    {doc.vehicles?.license_plate && <span>🚗 {doc.vehicles.license_plate}</span>}
                    {doc.expiration_date && <span>📅 Vence: {new Date(doc.expiration_date).toLocaleDateString("es-CL")}</span>}
                    <span>{new Date(doc.created_at).toLocaleDateString("es-CL")}</span>
                  </div>
                </div>
                <StatusBadge status={doc.status} />
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={doc.file_url} target="_blank" rel="noreferrer" title="Ver archivo"><Download className="h-4 w-4" /></a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id, doc.file_key)} title="Eliminar">
                    <Trash2 className="h-4 w-4" />
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
