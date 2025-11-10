import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

const AdminListaCompleta = () => {
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [selectedMes, setSelectedMes] = useState("");
  const [selectedQuinzena, setSelectedQuinzena] = useState("");

  const handleExportRelatorio = () => {
    if (!empresaSearch) {
      toast.error("Digite o nome ou CNPJ da empresa primeiro!");
      return;
    }
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Lista Completa
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualize todos os colaboradores e dependentes cadastrados
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard value={28} label="Total" color="total" />
          <StatCard value={24} label="Ativos" color="active" />
          <StatCard value={18} label="TotalPass" color="total" />
          <StatCard value={10} label="Epharma" color="family" />
        </div>

        {/* Filtros */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Filtros de Busca
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Nome ou CNPJ da empresa..."
              value={empresaSearch}
              onChange={(e) => setEmpresaSearch(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Período de busca"
            />

            <Select value={selectedMes} onValueChange={setSelectedMes}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">Janeiro</SelectItem>
                <SelectItem value="02">Fevereiro</SelectItem>
                <SelectItem value="03">Março</SelectItem>
                <SelectItem value="04">Abril</SelectItem>
                <SelectItem value="05">Maio</SelectItem>
                <SelectItem value="06">Junho</SelectItem>
                <SelectItem value="07">Julho</SelectItem>
                <SelectItem value="08">Agosto</SelectItem>
                <SelectItem value="09">Setembro</SelectItem>
                <SelectItem value="10">Outubro</SelectItem>
                <SelectItem value="11">Novembro</SelectItem>
                <SelectItem value="12">Dezembro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedQuinzena} onValueChange={setSelectedQuinzena}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primeira">Primeira Quinzena (1 a 15)</SelectItem>
                <SelectItem value="segunda">Segunda Quinzena (16 ao último dia)</SelectItem>
                <SelectItem value="completo">Mês Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleExportRelatorio}
              variant="default"
              size="lg"
              className="gap-2"
            >
              <FileDown className="h-5 w-5" />
              Exportar Relatório
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminListaCompleta;
