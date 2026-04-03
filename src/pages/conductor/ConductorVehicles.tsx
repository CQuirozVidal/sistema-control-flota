import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function ConductorVehicles() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("vehicle_assignments")
      .select("*, vehicles(*)")
      .eq("profile_id", profile.id)
      .then(({ data }) => setVehicles(data || []));
  }, [profile]);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold">Mis Vehículos</h2>
      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Truck className="h-12 w-12 mb-3 opacity-40" />
            <p>No tienes vehículos asignados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((va: any) => {
            const v = va.vehicles;
            return (
              <Card key={va.id} className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    {v.license_plate}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Marca:</span> {v.make}</p>
                  <p><span className="text-muted-foreground">Modelo:</span> {v.model}</p>
                  <p><span className="text-muted-foreground">Año:</span> {v.year}</p>
                  <p><span className="text-muted-foreground">Color:</span> {v.color}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
