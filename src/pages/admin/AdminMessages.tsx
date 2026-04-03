import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus } from "lucide-react";

export default function AdminMessages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [conductors, setConductors] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [msgRes, condRes] = await Promise.all([
      supabase.from("messages").select("*, receiver:profiles!messages_receiver_id_fkey(full_name), sender:profiles!messages_sender_id_fkey(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, full_name").eq("role", "conductor"),
    ]);
    setMessages(msgRes.data || []);
    setConductors(condRes.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: form.get("receiver_id") as string,
      content: form.get("content") as string,
      status: (form.get("status") as string) || "pendiente",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mensaje enviado" });
      setOpen(false);
      load();
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("messages").update({ status }).eq("id", id);
    toast({ title: `Estado actualizado a ${status}` });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-xl font-bold">Mensajes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo Mensaje</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar Mensaje</DialogTitle></DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label>Conductor</Label>
                <Select name="receiver_id" required>
                  <SelectTrigger><SelectValue placeholder="Seleccionar conductor" /></SelectTrigger>
                  <SelectContent>
                    {conductors.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select name="status" defaultValue="pendiente">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Textarea name="content" required placeholder="Escribe el mensaje..." />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 opacity-40" />
            <p>No hay mensajes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {messages.map((msg: any) => (
            <Card key={msg.id} className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs text-muted-foreground">De: {msg.sender?.full_name} → {msg.receiver?.full_name}</p>
                    <p className="text-sm mt-1">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(msg.created_at).toLocaleString("es-CL")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`status-badge-${msg.status}`}>{msg.status}</Badge>
                    <Select value={msg.status} onValueChange={(v) => updateStatus(msg.id, v)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
                      </SelectContent>
                    </Select>
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
