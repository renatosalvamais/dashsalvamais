import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";
import { useCompanies } from "@/hooks/useCompanies";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminListaCompleta = () => {
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [selectedMes, setSelectedMes] = useState("");
  const [selectedQuinzena, setSelectedQuinzena] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("");
  const { data: beneficiaries = [], isLoading: isLoadingBenef } = useBeneficiaries();
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();

  const companiesMap = useMemo(() => {
    const map = new Map<string, { nome: string; cnpj: string; beneficios?: any }>();
    for (const c of companies) {
      // @ts-ignore beneficios é JSON no banco
      map.set(c.id, { nome: c.nome, cnpj: c.cnpj, beneficios: c.beneficios || {} });
    }
    return map;
  }, [companies]);

  const normalizeText = (v: string) => v.toLowerCase().replace(/[\s\.\-\/_]/g, "");
  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  // Sugestões de empresas conforme digitação (nome ou CNPJ)
  const companySuggestions = useMemo(() => {
    if (!empresaSearch) return [] as { id: string; nome: string; cnpj: string }[];
    const qNorm = normalizeText(empresaSearch);
    const qDigits = onlyDigits(empresaSearch);
    return companies
      .filter((c) =>
        normalizeText(c.nome).includes(qNorm) || onlyDigits(c.cnpj).includes(qDigits)
      )
      .slice(0, 8);
  }, [companies, empresaSearch]);

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      const company = b.company_id ? companiesMap.get(b.company_id) : undefined;
      // filtro por empresa (nome ou cnpj)
      if (empresaSearch) {
        const q = normalizeText(empresaSearch);
        const nameOk = company ? normalizeText(company.nome).includes(q) : false;
        const cnpjOk = company ? onlyDigits(company.cnpj).includes(onlyDigits(empresaSearch)) : false;
        if (!nameOk && !cnpjOk) return false;
      }

      const created = b.created_at ? new Date(b.created_at) : null;
      if (!created) return false;

      // filtro por período (data início e fim)
      if (dataInicio && dataFinal) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFinal);
        fim.setHours(23, 59, 59, 999); // Incluir o dia inteiro final
        if (created < inicio || created > fim) return false;
      }

      // filtro por data específica (dia)
      if (selectedDate) {
        const y = created.getFullYear().toString();
        const m = (created.getMonth() + 1).toString().padStart(2, "0");
        const d = created.getDate().toString().padStart(2, "0");
        const createdIso = `${y}-${m}-${d}`;
        if (createdIso !== selectedDate) return false;
        // se filtramos por dia específico, ignoramos mês/quinzena adicionais
        return true;
      }

      // filtro por mês
      if (selectedMes) {
        const month = (created.getMonth() + 1).toString().padStart(2, "0");
        if (month !== selectedMes) return false;
      }

      // filtro por quinzena (independente do mês, e sem efeito no "completo")
      if (selectedQuinzena === "primeira" && created.getDate() > 15) return false;
      if (selectedQuinzena === "segunda" && created.getDate() < 16) return false;

      return true;
    });
  }, [beneficiaries, companiesMap, empresaSearch, selectedMes, selectedQuinzena, selectedDate, dataInicio, dataFinal]);

  const stats = useMemo(() => {
    const total = beneficiaries.length;
    const ativos = beneficiaries.filter((b) => b.ativo).length;
    // Aproximação: conta beneficiários em empresas com TotalPass/Epharma definidos
    let totalpass = 0;
    let epharma = 0;
    for (const b of beneficiaries) {
      const company = b.company_id ? companiesMap.get(b.company_id) : undefined;
      const ben = company?.beneficios || {};
      if (ben && typeof ben.totalpass === "string" && ben.totalpass.trim().length > 0) totalpass++;
      if (ben && typeof ben.epharma === "string" && ben.epharma.trim().length > 0) epharma++;
    }
    return { total, ativos, totalpass, epharma };
  }, [beneficiaries, companiesMap]);

  const handleExportRelatorio = () => {
    try {
      if (filteredBeneficiaries.length === 0) {
        toast.error("Nenhum registro para exportar com os filtros atuais.");
        return;
      }

      const header = [
        "Empresa",
        "CNPJ",
        "Nome",
        "CPF",
        "Telefone",
        "Status",
        "Dependentes",
        "Ativo",
        "Criado Em",
      ];

      const escape = (v: any) => {
        const s = v == null ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };

      const lines = filteredBeneficiaries.map((b) => {
        const company = b.company_id ? companiesMap.get(b.company_id) : undefined;
        return [
          escape(company?.nome || ""),
          escape(company?.cnpj || ""),
          escape(b.nome),
          escape(b.cpf),
          escape(b.telefone || ""),
          escape(b.status || ""),
          escape(b.dependentes ?? ""),
          escape(b.ativo ? "Sim" : "Não"),
          escape(b.created_at || ""),
        ].join(";");
      });

      const csv = [header.join(";"), ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio_lista_completa.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado com sucesso!");
    } catch (err: any) {
      toast.error("Falha ao exportar: " + (err?.message || String(err)));
    }
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
          <StatCard value={stats.total} label="Total" color="total" />
          <StatCard value={stats.ativos} label="Ativos" color="active" />
          <StatCard value={stats.totalpass} label="TotalPass" color="total" />
          <StatCard value={stats.epharma} label="Epharma" color="family" />
        </div>

        {/* Filtros */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Filtros de Busca
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Input
                placeholder="Nome ou CNPJ da empresa..."
                value={empresaSearch}
                onChange={(e) => setEmpresaSearch(e.target.value)}
              />
              {empresaSearch && companySuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-background border border-border rounded-md shadow-sm max-h-60 overflow-y-auto">
                  {companySuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between"
                      onClick={() => setEmpresaSearch(c.nome)}
                    >
                      <span className="text-sm text-foreground">{c.nome}</span>
                      <span className="text-xs text-muted-foreground">{c.cnpj}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              type="date"
              placeholder="Data específica"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
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
          </div>

          {/* Filtros de período */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Input
              type="date"
              placeholder="Data início"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            
            <Input
              type="date"
              placeholder="Data final"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
            />

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

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEmpresaSearch("");
                setSelectedDate("");
                setSelectedMes("");
                setSelectedQuinzena("");
                setDataInicio("");
                setDataFinal("");
              }}
            >
              Limpar Filtros
            </Button>
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

        {/* Lista dinâmica */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Registros
          </h2>

          {(isLoadingBenef || isLoadingCompanies) ? (
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs whitespace-nowrap">Empresa</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">CNPJ</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Nome</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">CPF</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Telefone</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Dependentes</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBeneficiaries.length > 0 ? (
                    filteredBeneficiaries.map((b) => {
                      const company = b.company_id ? companiesMap.get(b.company_id) : undefined;
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="text-xs">{company?.nome || "-"}</TableCell>
                          <TableCell className="text-xs">{company?.cnpj || "-"}</TableCell>
                          <TableCell className="text-xs">{b.nome}</TableCell>
                          <TableCell className="text-xs">{b.cpf}</TableCell>
                          <TableCell className="text-xs">{b.telefone || "-"}</TableCell>
                          <TableCell className="text-xs">{b.status || "-"}</TableCell>
                          <TableCell className="text-xs text-right">{b.dependentes ?? "-"}</TableCell>
                          <TableCell className="text-xs">{b.ativo ? "Sim" : "Não"}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminListaCompleta;
