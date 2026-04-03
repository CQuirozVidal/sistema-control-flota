import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Vehicle {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  status: string;
}

export default function AdminSearch() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  // Cargar TODAS las patentes al montar el componente
  useEffect(() => {
    fetchAllVehicles();
  }, []);

  const fetchAllVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("vehicles")
        .select("id, license_plate, brand, model, year, status")
        .order("license_plate", { ascending: true });

      if (err) {
        setError("Error al cargar las patentes");
        console.error("Error:", err);
      } else {
        setVehicles(data || []);
      }
    } catch (err) {
      setError("Error al conectar con la base de datos");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    if (!searchQuery.trim()) {
      // Si está vacío, mostrar todas
      fetchAllVehicles();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: err } = await supabase
        .from("vehicles")
        .select("id, license_plate, brand, model, year, status")
        .ilike("license_plate", `%${searchQuery}%`)
        .order("license_plate", { ascending: true });

      if (err) {
        setError("Error al buscar patentes");
        console.error("Error:", err);
      } else {
        setVehicles(data || []);
      }
    } catch (err) {
      setError("Error al conectar con la base de datos");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = searchQuery
    ? vehicles.filter((v) =>
        v.license_plate.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : vehicles;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buscar Patentes</h1>
        <p className="text-muted-foreground">
          Busca vehículos por su patente o visualiza todas las patentes disponibles
        </p>
      </div>

      {/* Buscador */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda de Vehículos</CardTitle>
          <CardDescription>
            Ingresa una patente para filtrar o deja vacío para ver todas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Ej: ABC-1234 o ABC1234"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setHasSearched(false);
                fetchAllVehicles();
              }}
              disabled={loading}
            >
              Limpiar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Errores */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabla de resultados */}
      <Card>
        <CardHeader>
          <CardTitle>
            Patentes Disponibles ({filteredVehicles.length})
          </CardTitle>
          <CardDescription>
            {searchQuery
              ? `Resultados para: "${searchQuery}"`
              : "Todas las patentes de la plataforma"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patente</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-semibold">
                        {vehicle.license_plate}
                      </TableCell>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            vehicle.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {vehicle.status === "active" ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {hasSearched
                  ? `No se encontraron patentes con "${searchQuery}"`
                  : "No hay patentes disponibles"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
