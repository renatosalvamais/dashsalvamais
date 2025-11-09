import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, userType: "admin" | "rh") => {
    e.preventDefault();
    setIsLoading(true);

    // Simular login
    setTimeout(() => {
      if (email && password) {
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
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img src={logo} alt="Salva+ Benefícios" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Sistema de Gestão de RH</h1>
          <p className="text-muted-foreground">Escolha o tipo de acesso</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Login RH */}
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <h2 className="text-xl font-semibold text-center mb-6 text-foreground">Acesso RH</h2>
            
            <form onSubmit={(e) => handleSubmit(e, "rh")} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-rh">E-mail</Label>
                <Input
                  id="email-rh"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-rh">Senha</Label>
                <Input
                  id="password-rh"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar como RH"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-primary hover:underline">
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          {/* Login Admin */}
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
            <h2 className="text-xl font-semibold text-center mb-6 text-foreground">Acesso Admin</h2>
            
            <form onSubmit={(e) => handleSubmit(e, "admin")} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-admin">E-mail</Label>
                <Input
                  id="email-admin"
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-admin">Senha</Label>
                <Input
                  id="password-admin"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar como Admin"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-primary hover:underline">
                Esqueceu sua senha?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
