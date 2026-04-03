import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await supabase
        .from("requests")
        .select("id, status, created_at")
        .order("created_at", { ascending: false });
      setRequests(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitudes</h1>
        <p className="text-muted-foreground">Gestiona todas las solicitudes de los conductores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Registradas</CardTitle>
          <CardDescription>Lista completa de solicitudes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        r.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        r.status === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay solicitudes</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
