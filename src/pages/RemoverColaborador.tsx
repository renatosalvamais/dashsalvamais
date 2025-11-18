import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useBeneficiaries, useDeleteBeneficiary } from "@/hooks/useBeneficiaries";

const RemoverColaborador = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { data: companyCtx } = useCurrentCompany();
  const companyId = companyCtx?.company?.id;
  const { data: beneficiaries = [], isLoading } = useBeneficiaries(companyId);
  const deleteBeneficiary = useDeleteBeneficiary();

  const filteredColaboradores = beneficiaries.filter((b) =>
    b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.cpf.replace(/\D/g, "").includes(searchTerm.replace(/\D/g, ""))
  );

  const handleDelete = async (id: string, nome: string) => {
    try {
      await deleteBeneficiary.mutateAsync(id);
      toast({ title: "Colaborador removido", description: `${nome} foi removido com sucesso.` });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Remover Colaborador
          </h1>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-6 w-6 text-foreground" />
            <h2 className="text-2xl font-bold text-card-foreground">
              Buscar Colaborador
            </h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Buscar por nome, CPF ou e-mail
          </p>

          <div className="flex gap-3">
            <Input
              placeholder="Digite pelo menos 2 caracteres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="search" className="gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-card-foreground mb-6">
            Lista de Colaboradores
          </h2>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : filteredColaboradores.length > 0 ? (
              filteredColaboradores.map((colab) => (
                <div
                  key={colab.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{colab.nome}</div>
                    <div className="text-sm text-muted-foreground">CPF: {colab.cpf}</div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDelete(colab.id, colab.nome)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Nenhum colaborador encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RemoverColaborador;
