import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Truck, Shield, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;

    if (!email || !password) {
      toast({ title: "Campos requeridos", description: "Ingresa correo y contraseña.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      toast({ title: "Correo inválido", description: "Ingresa un correo electrónico válido.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Error al iniciar sesión", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;

    if (!name || name.length < 3) {
      toast({ title: "Nombre inválido", description: "El nombre debe tener al menos 3 caracteres.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!validateEmail(email)) {
      toast({ title: "Correo inválido", description: "Ingresa un correo electrónico válido.", variant: "destructive" });
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      toast({ title: "Contraseña débil", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Cuenta creada!", description: "Ya puedes iniciar sesión con tus credenciales." });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/25">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">FlotaControl</h1>
          <p className="text-sm text-muted-foreground mt-1">Transportes Santa Aurora SpA</p>
          <p className="text-xs text-muted-foreground mt-0.5">Gestión documental y operativa de flota</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input id="login-email" name="email" type="email" required placeholder="correo@santaaurora.cl" autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Input id="login-password" name="password" type={showPassword ? "text" : "password"} required minLength={6} autoComplete="current-password" className="pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nombre completo</Label>
                    <Input id="reg-name" name="name" required placeholder="Carlos Muñoz Rojas" maxLength={100} minLength={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Correo electrónico</Label>
                    <Input id="reg-email" name="email" type="email" required placeholder="correo@santaaurora.cl" autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Contraseña (mín. 6 caracteres)</Label>
                    <div className="relative">
                      <Input id="reg-password" name="password" type={showPassword ? "text" : "password"} required minLength={6} autoComplete="new-password" className="pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                    {loading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          Acceso seguro con cifrado de extremo a extremo
        </div>
      </div>
    </div>
  );
}
