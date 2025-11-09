import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Colaborador {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

const CadastrarColaborador = () => {
  const navigate = useNavigate();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(
    Array(5).fill(null).map(() => ({ nome: "", cpf: "", telefone: "", email: "" }))
  );

  const adicionarLinhas = () => {
    const novasLinhas = Array(5).fill(null).map(() => ({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
    }));
    setColaboradores([...colaboradores, ...novasLinhas]);
  };

  const limparLinhas = () => {
    setColaboradores(
      Array(5).fill(null).map(() => ({ nome: "", cpf: "", telefone: "", email: "" }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Colaboradores cadastrados com sucesso!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Cadastrar Colaboradores
            </h1>
            <p className="text-muted-foreground">
              Empresa: Salva+ Benefícios - CNPJ: 34.225.216/0001-77
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-xl font-bold text-card-foreground mb-6">
            Lista de Colaboradores
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total de linhas disponíveis: <span className="font-semibold">{colaboradores.length}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-semibold">#</th>
                    <th className="text-left p-3 text-sm font-semibold">Nome Completo</th>
                    <th className="text-left p-3 text-sm font-semibold">CPF</th>
                    <th className="text-left p-3 text-sm font-semibold">Telefone (DDD)</th>
                    <th className="text-left p-3 text-sm font-semibold">E-mail</th>
                    <th className="text-left p-3 text-sm font-semibold">Dependentes</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradores.map((_, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="p-3 text-sm">{index + 1}</td>
                      <td className="p-3">
                        <Input
                          placeholder="Nome completo"
                          className="bg-muted/50"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="(11) 99999-9999"
                          className="bg-muted/50"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="email@exemplo.com"
                          type="email"
                          className="bg-muted/50"
                        />
                      </td>
                      <td className="p-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Users className="h-4 w-4" />
                          Gerenciar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={adicionarLinhas}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Mais Linhas
              </Button>
              <Button
                type="button"
                onClick={limparLinhas}
                variant="outline"
                className="flex-1 gap-2"
              >
                Limpar
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                className="px-12"
              >
                ENVIAR
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

const Users = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default CadastrarColaborador;
