import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * ConductorMessages — El conductor puede ver mensajes del admin
 * y marcar cada mensaje como "en_proceso" o "completado".
 */
export default function ConductorMessages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(full_name)")
      .eq("receiver_id", profile.id)
      .order("created_at", { ascending: false });
    setMessages(data || []);
  };

  useEffect(() => { load(); }, [profile]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("messages").update({ status, read_at: status !== "pendiente" ? new Date().toISOString() : null }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Mensaje marcado como: ${status.replace("_", " ")}` });
      load();
    }
  };

  const pending = messages.filter(m => m.status === "pendiente").length;
  const inProcess = messages.filter(m => m.status === "en_proceso").length;

  return (
    <div>
      <PageHeader title="Mensajes" description={`${messages.length} mensaje(s) — ${pending} pendiente(s), ${inProcess} en proceso`} />

      {messages.length === 0 ? (
        <Card><CardContent className="empty-state"><MessageSquare /><p>No tienes mensajes.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {messages.map((msg: any) => (
            <Card key={msg.id} className={`stat-card ${msg.status === "pendiente" ? "border-warning/30 bg-warning/[0.02]" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-xs font-medium text-muted-foreground">De: {msg.sender?.full_name || "Administrador"}</p>
                      <StatusBadge status={msg.status} />
                    </div>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(msg.created_at).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  {/* Acciones del conductor para cambiar estado */}
                  <div className="flex gap-1.5 shrink-0">
                    {msg.status !== "en_proceso" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 h-8 border-info/30 text-info hover:bg-info/10"
                        onClick={() => updateStatus(msg.id, "en_proceso")}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        En proceso
                      </Button>
                    )}
                    {msg.status !== "completado" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 h-8 border-accent/30 text-accent hover:bg-accent/10"
                        onClick={() => updateStatus(msg.id, "completado")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completado
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
