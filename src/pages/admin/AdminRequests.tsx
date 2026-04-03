import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import StatusBadge, { REQUEST_STATUSES } from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { ClipboardList, Search } from "lucide-react";

/**
 * AdminRequests — Gestión de solicitudes con filtro por estado,
 * búsqueda por nombre de conductor y cambio de estado inline.
 */
export default function AdminRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("pendiente");
  const [search, setSearch] = useState("");

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
    else { toast({ title: `Estado actualizado: ${status.replace("_", " ")}` }); load(); }
  };

  const filtered = search.trim()
    ? requests.filter((r: any) =>
        (r.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.vehicles?.license_plate || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.details || "").toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  return (
    <div>
      <PageHeader title="Gestión de Solicitudes" description={`${filtered.length} resultado(s)`}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar conductor o patente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-[200px] h-8 text-xs"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {filtered.length === 0 ? (
        <Card><CardContent className="empty-state"><ClipboardList /><p>No hay solicitudes con estos filtros.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((req: any) => (
            <Card key={req.id} className={`stat-card ${req.status === "pendiente" ? "border-warning/20" : ""}`}>
              <CardContent className="flex items-center gap-4 p-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{req.request_types?.name}</p>
                    {req.amount && (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        💰 ${Number(req.amount).toLocaleString("es-CL")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {req.profiles?.full_name}
                    {req.vehicles?.license_plate ? ` • ${req.vehicles.license_plate}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{req.details || "Sin detalles"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleDateString("es-CL", { dateStyle: "medium" })}
                  </p>
                </div>
                <StatusBadge status={req.status} />
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
