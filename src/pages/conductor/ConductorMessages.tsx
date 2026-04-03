import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold">Mensajes</h2>
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">De: {msg.sender?.full_name || "Admin"}</p>
                    <p className="text-sm mt-1">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(msg.created_at).toLocaleString("es-CL")}</p>
                  </div>
                  <Badge variant="outline" className={`status-badge-${msg.status} shrink-0`}>{msg.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
