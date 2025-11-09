import { useState } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const colaboradoresData = [
  {
    nome: "JOAO DE SOUZA DA SILVA",
    cpf: "607.773.270-23",
    telefone: "(91) 98843-9588",
    dependentes: 2,
    status: "Ativo",
    dataCadastro: "08/08/2025",
    dataExclusao: "-",
  },
  {
    nome: "Joao Paulo Souza Dev",
    cpf: "534.753.070-73",
    telefone: "(91) 98843-9574",
    dependentes: 0,
    status: "Removido",
    dataCadastro: "04/08/2025",
    dataExclusao: "09/11/2025",
  },
  {
    nome: "LUIZ DOURADO DIAS JUNIOR",
    cpf: "791.185.680-09",
    telefone: "(91) 98843-9574",
    dependentes: 3,
    status: "Ativo",
    dataCadastro: "31/07/2025",
    dataExclusao: "-",
  },
];

const ListaCompleta = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const handleDelete = (nome: string) => {
    toast({
      title: "Colaborador excluído",
      description: `${nome} foi excluído com sucesso.`,
    });
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
          <StatCard value={28} label="Total" color="total" />
          <StatCard value={24} label="Ativos" color="active" />
          <StatCard value={18} label="Individual" color="total" />
          <StatCard value={10} label="Familiar" color="family" />
          <StatCard value={4} label="Removidos" color="removed" />
        </div>

        {/* Update Button */}
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Atualizar lista (4 removidos)
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
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-sm font-semibold">Ativo</th>
                  <th className="text-left p-3 text-sm font-semibold">Data Cadastro</th>
                  <th className="text-left p-3 text-sm font-semibold">Data Exclusão</th>
                  <th className="text-left p-3 text-sm font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {colaboradoresData.map((colab, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{colab.nome}</div>
                    </td>
                    <td className="p-3 text-sm">{colab.cpf}</td>
                    <td className="p-3 text-sm">{colab.telefone}</td>
                    <td className="p-3 text-sm text-center">{colab.dependentes}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          colab.status === "Ativo"
                            ? "bg-warning text-warning-foreground"
                            : "bg-destructive text-destructive-foreground"
                        }`}
                      >
                        {colab.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          colab.status === "Ativo"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {colab.status === "Ativo" ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{colab.dataCadastro}</td>
                    <td className="p-3 text-sm">{colab.dataExclusao}</td>
                    <td className="p-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDelete(colab.nome)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ListaCompleta;
