import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Building2 } from "lucide-react";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, userType: "admin" | "empresa") => {
    e.preventDefault();
    setIsLoading(true);

    // Simular login
    setTimeout(() => {
      if (usuario && password) {
        toast.success("Login realizado com sucesso!");
        if (userType === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.error("Preencha todos os campos");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logo} alt="Salva+ Benefícios" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sistema de Gestão de RH</h1>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none h-16 bg-transparent p-0">
              <TabsTrigger 
                value="admin" 
                className="rounded-none h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground font-semibold text-base gap-2"
              >
                <User className="h-5 w-5" />
                Administrador
              </TabsTrigger>
              <TabsTrigger 
                value="empresa" 
                className="rounded-none h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground font-semibold text-base gap-2"
              >
                <Building2 className="h-5 w-5" />
                Empresa
              </TabsTrigger>
            </TabsList>

            <div className="p-8">
              <TabsContent value="admin" className="mt-0">
                <form onSubmit={(e) => handleSubmit(e, "admin")} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="usuario-admin" className="text-base font-medium">Usuário</Label>
                    <Input
                      id="usuario-admin"
                      type="text"
                      placeholder="Digite seu usuário"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-admin" className="text-base font-medium">Senha</Label>
                    <Input
                      id="password-admin"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="empresa" className="mt-0">
                <form onSubmit={(e) => handleSubmit(e, "empresa")} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj-empresa" className="text-base font-medium">CNPJ</Label>
                    <Input
                      id="cnpj-empresa"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-empresa" className="text-base font-medium">Senha</Label>
                    <Input
                      id="password-empresa"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <div className="mt-6 text-center">
                <a href="#" className="text-sm text-primary hover:underline">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;
