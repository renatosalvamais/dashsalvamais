import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_ADMIN_EMAIL = "admin@salvamais.com";
const DEFAULT_ADMIN_PASSWORD = "Admin@SalvaMais2025!";

const AdminSeed = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Preparando...");

  useEffect(() => {
    const seed = async () => {
      const email = DEFAULT_ADMIN_EMAIL;
      const password = DEFAULT_ADMIN_PASSWORD;

      try {
        setStatus("Criando usuário admin...");
        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        // Se o usuário já existir, seguimos adiante
        if (signUpError && !signUpError.message.toLowerCase().includes("already")) {
          toast.error(`Erro ao criar usuário: ${signUpError.message}`);
          setStatus("Erro ao criar usuário");
          return;
        }

        setStatus("Atribuindo papel de admin...");
        const { data: seeded, error: seedError } = await supabase.rpc("seed_admin_by_email", { _email: email });
        if (seedError) {
          toast.error(`Erro ao atribuir admin: ${seedError.message}`);
          setStatus("Erro ao atribuir admin");
          return;
        }

        toast.success("Administrador criado/atribuído com sucesso!");
        setStatus("Concluído, realizando login...");

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          toast.info("Login não efetuado (confirmação de email pode ser necessária). Redirecionando para o login.");
          setStatus("Redirecionando para login...");
          navigate("/login");
          return;
        }

        navigate("/admin/dashboard");
      } catch (err: any) {
        toast.error(err?.message || "Erro inesperado ao criar admin");
        setStatus("Erro inesperado");
      }
    };

    // Executa automaticamente ao abrir a página
    seed();
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Seed de Administrador</h1>
      <p>{status}</p>
      <p>Email: {DEFAULT_ADMIN_EMAIL}</p>
    </div>
  );
};

export default AdminSeed;