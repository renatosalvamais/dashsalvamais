import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";
import { formatCPF, formatPhone } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useCreateBeneficiary } from "@/hooks/useBeneficiaries";

interface Colaborador {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dependente1?: string;
  cpf1?: string;
  dependente2?: string;
  cpf2?: string;
  dependente3?: string;
  cpf3?: string;
}

const CadastrarColaborador = () => {
  const navigate = useNavigate();
  const { data: companyCtx } = useCurrentCompany();
  const createBeneficiary = useCreateBeneficiary();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(
    Array(5).fill(null).map(() => ({ 
      nome: "", 
      cpf: "", 
      telefone: "", 
      email: "",
      dependente1: "",
      cpf1: "",
      dependente2: "",
      cpf2: "",
      dependente3: "",
      cpf3: ""
    }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = companyCtx?.company?.id;
    if (!companyId) {
      toast.error("Empresa não identificada. Faça login novamente.");
      return;
    }

    const rows = colaboradores.filter((c) => c.nome.trim() && c.cpf.trim());
    if (rows.length === 0) {
      toast.error("Preencha ao menos um colaborador com Nome e CPF.");
      return;
    }

    try {
      for (const c of rows) {
        await createBeneficiary.mutateAsync({
          company_id: companyId,
          nome: c.nome.trim(),
          cpf: c.cpf.replace(/\D/g, ""),
          telefone: c.telefone ? c.telefone.replace(/\D/g, "") : null,
          dependentes: 0,
          ativo: true,
          status: "Ativo",
        });
      }
      toast.success("Colaboradores cadastrados com sucesso!");
      limparLinhas();
    } catch (err: any) {
      toast.error("Falha ao cadastrar: " + err.message);
    }
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
                    <th className="text-left p-3 text-sm font-semibold">Dep. 1</th>
                    <th className="text-left p-3 text-sm font-semibold">CPF 1</th>
                    <th className="text-left p-3 text-sm font-semibold">Dep. 2</th>
                    <th className="text-left p-3 text-sm font-semibold">CPF 2</th>
                    <th className="text-left p-3 text-sm font-semibold">Dep. 3</th>
                    <th className="text-left p-3 text-sm font-semibold">CPF 3</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradores.map((colab, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="p-3 text-sm">{index + 1}</td>
                      <td className="p-3">
                        <Input
                          placeholder="Nome completo"
                          className="bg-muted/50"
                          value={colab.nome}
                          onChange={(e) => {
                            const v = e.target.value;
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, nome: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50"
                          value={colab.cpf}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, cpf: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="(11) 99999-9999"
                          className="bg-muted/50"
                          value={colab.telefone}
                          onChange={(e) => {
                            const v = formatPhone(e.target.value);
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, telefone: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="Nome dep. 1"
                          className="bg-muted/50"
                          value={colab.dependente1 || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, dependente1: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50"
                          value={colab.cpf1 || ""}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, cpf1: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="Nome dep. 2"
                          className="bg-muted/50"
                          value={colab.dependente2 || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, dependente2: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50"
                          value={colab.cpf2 || ""}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, cpf2: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="Nome dep. 3"
                          className="bg-muted/50"
                          value={colab.dependente3 || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, dependente3: v } : p));
                          }}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50"
                          value={colab.cpf3 || ""}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setColaboradores((prev) => prev.map((p, i) => i === index ? { ...p, cpf3: v } : p));
                          }}
                        />
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
                variant="search"
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
