import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Truck } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalRequests: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [vehicles, requests] = await Promise.all([
        supabase.from("vehicles").select("id, status"),
        supabase.from("requests").select("id, status"),
      ]);

      setStats({
        totalVehicles: vehicles.data?.length || 0,
        activeVehicles: vehicles.data?.filter(v => v.status === "active").length || 0,
        totalRequests: requests.data?.length || 0,
        pendingRequests: requests.data?.filter(r => r.status === "pendiente").length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Resumen general de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vehículos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vehículos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitudes Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitudes Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenida al Panel Administrativo</CardTitle>
          <CardDescription>
            Usa el menú lateral para navegar entre diferentes secciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Truck className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">Buscar Patentes</p>
              <p className="text-sm text-muted-foreground">Busca vehículos por su patente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
