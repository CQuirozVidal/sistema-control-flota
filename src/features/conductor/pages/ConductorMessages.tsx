import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import PageHeader from "@/components/PageHeader";
import { MessageSquare } from "lucide-react";

export default function ConductorMessages() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(full_name)")
      .eq("receiver_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMessages(data || []));
  }, [profile]);

  return (
    <div>
      <PageHeader title="Mensajes" description={`${messages.length} mensaje(s) recibido(s)`} />

      {messages.length === 0 ? (
        <Card><CardContent className="empty-state"><MessageSquare /><p>No tienes mensajes.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {messages.map((msg: any) => (
            <Card key={msg.id} className="stat-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium text-muted-foreground">De: {msg.sender?.full_name || "Administrador"}</p>
                      <StatusBadge status={msg.status} />
                    </div>
                    <p className="text-sm mt-2 leading-relaxed">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(msg.created_at).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
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
