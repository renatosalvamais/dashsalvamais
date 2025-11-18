import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Building2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const digitsOnly = (v: string) => v.replace(/\D/g, "");

  const computeEmail = (userType: "admin" | "empresa") => {
    if (userType === "admin") return usuario;
    const cnpjDigits = digitsOnly(usuario);
    return `${cnpjDigits}@empresa.com`;
  };

  const handleResendConfirmation = async (userType: "admin" | "empresa") => {
    const email = computeEmail(userType);
    if (!email) {
      toast.error("Informe o usuário/email antes de reenviar a confirmação.");
      return;
    }
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      toast.error(error.message || "Falha ao reenviar confirmação");
    } else {
      toast.success("Email de confirmação reenviado.");
    }
  };

  const handleResetPassword = async (userType: "admin" | "empresa") => {
    const email = computeEmail(userType);
    if (!email) {
      toast.error("Informe o usuário/email antes de recuperar a senha.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/login",
    });
    if (error) {
      toast.error(error.message || "Falha ao enviar link de recuperação");
    } else {
      toast.success("Enviamos um link para recuperar sua senha.");
    }
  };

  const handleSubmit = async (e: React.FormEvent, userType: "admin" | "empresa") => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const email = computeEmail(userType);

      // Para empresa, normaliza CNPJ e usa como senha padrão
      const isEmpresa = userType === "empresa";
      const cnpjDigits = isEmpresa ? digitsOnly(usuario) : undefined;
      if (isEmpresa && (!cnpjDigits || cnpjDigits.length !== 14)) {
        throw new Error("Informe um CNPJ válido (14 dígitos)");
      }

      // 1) Tentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2) Se credenciais inválidas e for empresa, tentar criar o usuário automaticamente
      if (error && isEmpresa) {
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupError) {
          // Se usuário já existir, orientar reset de senha e garantir role via função de servidor
          if (String(signupError.message).toLowerCase().includes("already registered")) {
            try {
              // Garante criação de role usando Service Role via Edge Function
              await supabase.functions.invoke("provision-company-user", {
                body: { cnpj: cnpjDigits },
              });
            } catch (fnErr) {
              // Não interrompe fluxo; apenas registra
              console.warn("Falha ao garantir role via função:", fnErr);
            }
            toast.error("Conta já existe. Se esqueceu a senha, use 'Esqueci minha senha'.");
          } else {
            throw signupError;
          }
        } else {
          try {
            // Garante criação de role usando Service Role via Edge Function
            await supabase.functions.invoke("provision-company-user", {
              body: { cnpj: cnpjDigits },
            });
          } catch (fnErr) {
            console.warn("Falha ao provisionar role após signup:", fnErr);
          }
        }

        // Tentar login novamente após criar
        const retry = await supabase.auth.signInWithPassword({ email, password });
        if (retry.error) throw retry.error;
        if (!retry.data?.user) throw new Error("Falha ao autenticar o usuário da empresa");

        // Prosseguir com fluxo usando retry
        const user = retry.data.user;
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        toast.success("Login realizado com sucesso!");
        if (isEmpresa) {
          // Empresa navega independente da role; garantimos role em background
          navigate("/dashboard");
        } else if (roleData?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
        return;
      }

      if (error) throw error;

      if (data.user) {
        // Verificar role do usuário
        let { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        // Se não tiver role e for empresa, atribui 'rh' automaticamente
        if (!roleData && isEmpresa && cnpjDigits) {
          // Usa função de servidor para evitar bloqueios de RLS
          try {
            await supabase.functions.invoke("provision-company-user", {
              body: { cnpj: cnpjDigits },
            });
          } catch (fnErr) {
            console.warn("Falha ao garantir role no pós-login:", fnErr);
          }
          // Fallback: tenta criar role pelo cliente (sem onConflict, faz select/insert/update)
          try {
            const { data: existing } = await supabase
              .from("user_roles")
              .select("id")
              .eq("user_id", data.user.id)
              .maybeSingle();

            if (existing?.id) {
              await supabase
                .from("user_roles")
                .update({ role: "rh", cnpj: cnpjDigits })
                .eq("id", existing.id);
            } else {
              await supabase
                .from("user_roles")
                .insert({ user_id: data.user.id, role: "rh", cnpj: cnpjDigits });
            }
          } catch (clientErr) {
            console.warn("Falha ao criar role via cliente:", clientErr);
          }
          const res = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .maybeSingle();
          roleData = res.data;
        }

        // Empresa navega independente da role; garantimos role em background
        toast.success("Login realizado com sucesso!");
        if (isEmpresa) {
          navigate("/dashboard");
        } else if (roleData?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
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
                  <div className="flex items-center justify-between mt-2">
                    <Button type="button" variant="link" className="px-0"
                      onClick={() => handleResendConfirmation("admin")}
                    >
                      Reenviar confirmação de email
                    </Button>
                    <Button type="button" variant="link" className="px-0"
                      onClick={() => handleResetPassword("admin")}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Senha padrão é o próprio CNPJ (somente números). Você poderá alterá-la depois.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="flex items-center justify-between mt-2">
                    <Button type="button" variant="link" className="px-0"
                      onClick={() => handleResendConfirmation("empresa")}
                    >
                      Reenviar confirmação de email
                    </Button>
                    <Button type="button" variant="link" className="px-0"
                      onClick={() => handleResetPassword("empresa")}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
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
