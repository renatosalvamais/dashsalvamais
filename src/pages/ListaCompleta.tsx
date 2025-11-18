import { useState } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useBeneficiaries, useDeleteBeneficiary } from "@/hooks/useBeneficiaries";
import { formatCNPJ } from "@/lib/utils";

const ListaCompleta = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const { data: companyCtx } = useCurrentCompany();
  const companyId = companyCtx?.company?.id;
  const { data: beneficiaries = [], isLoading } = useBeneficiaries(companyId);
  const deleteBeneficiary = useDeleteBeneficiary();

  const stats = {
    total: beneficiaries.length,
    ativos: beneficiaries.filter((b) => b.ativo ?? true).length,
    individual: beneficiaries.filter((b) => (b.dependentes ?? 0) === 0).length,
    familiar: beneficiaries.filter((b) => (b.dependentes ?? 0) > 0).length,
    removidos: 0, // Somente ativos são carregados neste painel
  };

  const filtered = beneficiaries.filter((b) => {
    const matchesSearch =
      b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.cpf.replace(/\D/g, "").includes(searchTerm.replace(/\D/g, ""));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "ativo" && (b.ativo ?? true)) ||
      (statusFilter === "removido" && false);

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, nome: string) => {
    try {
      await deleteBeneficiary.mutateAsync(id);
      toast({ title: "Colaborador excluído", description: `${nome} foi excluído com sucesso.` });
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e.message });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Lista Completa
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard value={stats.total} label="Total" color="total" />
          <StatCard value={stats.ativos} label="Ativos" color="active" />
          <StatCard value={stats.individual} label="Individual" color="total" />
          <StatCard value={stats.familiar} label="Familiar" color="family" />
          <StatCard value={stats.removidos} label="Removidos" color="removed" />
        </div>

        {/* Update Button */}
        <Button variant="destructive" className="gap-2" disabled={isLoading}>
          <Trash2 className="h-4 w-4" />
          Atualizar lista
        </Button>

        {/* Table */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-xl font-bold text-card-foreground mb-6">
            Colaboradores e Dependentes
          </h2>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="removido">Removido</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              Colunas
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-semibold">Nome</th>
                  <th className="text-left p-3 text-sm font-semibold">CPF</th>
                  <th className="text-left p-3 text-sm font-semibold">Telefone</th>
                  <th className="text-left p-3 text-sm font-semibold">Qtd. Dependentes</th>
                  <th className="text-left p-3 text-sm font-semibold">Ativo</th>
                  <th className="text-left p-3 text-sm font-semibold">Data Cadastro</th>
                  <th className="text-left p-3 text-sm font-semibold">Data Exclusão</th>
                  <th className="text-left p-3 text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-sm text-muted-foreground">Carregando...</td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((b) => (
                    <tr key={b.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3"><div className="font-medium">{b.nome}</div></td>
                      <td className="p-3 text-sm">{b.cpf}</td>
                      <td className="p-3 text-sm">{b.telefone ?? "-"}</td>
                      <td className="p-3 text-sm text-center">{b.dependentes ?? 0}</td>
                      <td className="p-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${ (b.ativo ?? true) ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground" }`}>
                          {(b.ativo ?? true) ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{b.created_at ? new Date(b.created_at).toLocaleDateString() : "-"}</td>
                      <td className="p-3 text-sm">{b.deleted_at ? new Date(b.deleted_at).toLocaleDateString() : "-"}</td>
                      <td className="p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDelete(b.id, b.nome)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ListaCompleta;
