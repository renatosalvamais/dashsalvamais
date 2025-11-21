import { useState } from "react";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Search, Pencil, FileDown, Trash2 } from "lucide-react";
import { formatCNPJ } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCompanies, useDeleteCompany } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminEmpresas() {
  const navigate = useNavigate();
  const { data: companies = [], isLoading, refetch } = useCompanies();
  const deleteCompany = useDeleteCompany();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingXLSX, setIsExportingXLSX] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{id: string, nome: string} | null>(null);

  const normalizeHeader = (h: unknown) =>
    String(h ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const parseNumber = (v: unknown): number => {
    if (v == null) return 0;
    const s = String(v).trim();
    if (!s) return 0;
    // tenta número direto
    const num = Number(s.replace(/[^0-9.,-]/g, "").replace(/\.(?=.*\.)/g, "").replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, ""));
    if (!isNaN(num)) return num;
    return 0;
  };

  const parseCurrencyBRL = (v: unknown): number => {
    if (v == null) return 0;
    // Remove símbolo, espaços e pontos de milhar, converte vírgula final em ponto
    const s = String(v)
      .replace(/[^0-9.,-]/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .replace(/,(?=\d{1,2}$)/, ".")
      .replace(/,/g, "")
      .trim();
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  };

  const parseBoolean = (v: unknown): boolean | null => {
    if (v == null) return null;
    const s = String(v)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (["sim", "s", "yes", "y", "true", "1", "ativo"].includes(s)) return true;
    if (["nao", "não", "n", "no", "false", "0", "inativo"].includes(s)) return false;
    const num = Number(s.replace(/[^0-9.-]/g, ""));
    if (!isNaN(num)) return num > 0;
    return null;
  };

  const handleImportClick = () => {
    const input = document.getElementById("import-companies-input") as HTMLInputElement | null;
    if (input) input.click();
  };

  const headerSynonyms: Record<string, string[]> = {
    cnpj: ["cnpj"],
    nome: ["nome", "empresa", "razao social", "razaosocial"],
    cidade: ["cidade", "municipio"],
    email: ["email"],
    telefone: ["telefone", "celular", "whatsapp", "telefone empresa"],
    endereco: ["endereco", "endereço", "logradouro", "rua", "av", "avenida"],
    contato: ["contato", "responsavel", "responsável", "ponto de contato"],
    total_vidas: ["total de vidas", "vidas", "qtde vidas", "quantidade de vidas", "totalvidas"],
    total_individual: ["total individual", "individual", "vidas individual", "qtde individual", "qtd individual"],
    total_familiar: ["total familiar", "familiar", "vidas familiar", "qtde familiar", "qtd familiar"],
    plano: ["plano", "produto"],
    desconto: ["% desconto", "desconto", "percentual desconto", "percentual"],
    valor: ["valor", "mensalidade", "preco", "total mensal", "totalmensal"],
    beneficios_odonto: ["odonto", "plano odonto", "odontologico", "odontológico"],
    beneficios_seguro_vida: ["seguro de vida", "seguro", "vida", "sv"],
    beneficios_funeral: ["assistencia funeral", "assistência funeral", "funeral", "af"],
    // Novos benefícios suportados
    beneficios_clube_descontos: ["clube de descontos", "clube descontos"],
    beneficios_clube_descontos_dependente: [
      "clube de descontos dependente",
      "clube descontos dependente",
      "clube de descontos dep",
      "clube descontos dep",
    ],
    beneficios_telemedicina: ["telemedicina"],
    beneficios_telemedicina_familiar: [
      "telemedicina familiar",
      "telemedicina fam",
      "telemedicina dependente",
    ],
    beneficios_unimais: ["unimais"],
    beneficios_ubook: ["ubook", "u book", "u-book"],
  };

  const getValueBySynonyms = (row: Record<string, any>, synonyms: string[]) => {
    const entries = Object.entries(row);
    for (const [key, value] of entries) {
      const nk = normalizeHeader(key);
      if (synonyms.includes(nk)) return value;
    }
    return undefined;
  };

  const getBooleanBySynonyms = (row: Record<string, any>, synonyms: string[]) => {
    const v = getValueBySynonyms(row, synonyms);
    return parseBoolean(v);
  };

  const buildBenefits = (row: Record<string, any>) => {
    const odonto = getBooleanBySynonyms(row, headerSynonyms.beneficios_odonto);
    const seguro = getBooleanBySynonyms(row, headerSynonyms.beneficios_seguro_vida);
    const funeral = getBooleanBySynonyms(row, headerSynonyms.beneficios_funeral);
    // Novos benefícios
    const clubeDescontos = getBooleanBySynonyms(row, headerSynonyms.beneficios_clube_descontos);
    const clubeDescontosDep = getBooleanBySynonyms(row, headerSynonyms.beneficios_clube_descontos_dependente);
    const telemedicina = getBooleanBySynonyms(row, headerSynonyms.beneficios_telemedicina);
    const telemedicinaFam = getBooleanBySynonyms(row, headerSynonyms.beneficios_telemedicina_familiar);
    const unimais = getBooleanBySynonyms(row, headerSynonyms.beneficios_unimais);
    const ubook = getBooleanBySynonyms(row, headerSynonyms.beneficios_ubook);
    const ben: Record<string, boolean> = {};
    if (odonto !== null) ben.odonto = !!odonto;
    if (seguro !== null) ben.seguro_vida = !!seguro;
    if (funeral !== null) ben.assistencia_funeral = !!funeral;
    if (clubeDescontos !== null) ben.clubeDescontos = !!clubeDescontos;
    if (clubeDescontosDep !== null) ben.clubeDescontosDependente = !!clubeDescontosDep;
    if (telemedicina !== null) ben.telemedicina = !!telemedicina;
    if (telemedicinaFam !== null) ben.telemedicinaFamiliar = !!telemedicinaFam;
    if (unimais !== null) ben.unimais = !!unimais;
    if (ubook !== null) ben.ubook = !!ubook;
    return Object.keys(ben).length ? ben : null;
  };

  const buildCompanyPayload = (row: Record<string, any>) => {
    const rawCnpj = getValueBySynonyms(row, headerSynonyms.cnpj) ?? "";
    const digits = String(rawCnpj).replace(/\D/g, "");
    const cnpjFormatted = digits.length === 14 ? formatCNPJ(digits) : String(rawCnpj);
    return {
      cnpj: cnpjFormatted,
      nome: getValueBySynonyms(row, headerSynonyms.nome) ?? "",
      cidade: (getValueBySynonyms(row, headerSynonyms.cidade) as string | undefined) ?? null,
      email: (getValueBySynonyms(row, headerSynonyms.email) as string | undefined) ?? null,
      telefone: (getValueBySynonyms(row, headerSynonyms.telefone) as string | undefined) ?? null,
      endereco: (getValueBySynonyms(row, headerSynonyms.endereco) as string | undefined) ?? null,
      contato: (getValueBySynonyms(row, headerSynonyms.contato) as string | undefined) ?? null,
      total_vidas: parseNumber(getValueBySynonyms(row, headerSynonyms.total_vidas)),
      total_individual: parseNumber(getValueBySynonyms(row, headerSynonyms.total_individual)),
      total_familiar: parseNumber(getValueBySynonyms(row, headerSynonyms.total_familiar)),
      plano: (getValueBySynonyms(row, headerSynonyms.plano) as string | undefined) ?? null,
      desconto: parseNumber(getValueBySynonyms(row, headerSynonyms.desconto)),
      valor: parseCurrencyBRL(getValueBySynonyms(row, headerSynonyms.valor)),
      beneficios: buildBenefits(row),
    } as const;
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows || rows.length === 0) {
        toast.error("Planilha vazia ou inválida.");
        setIsImporting(false);
        return;
      }

      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      for (const r of rows as Record<string, any>[]) {
        // valida colunas mínimas
        const keys = Object.keys(r).map(normalizeHeader);
        const hasBasic = keys.includes("cnpj") && keys.includes("nome");
        if (!hasBasic) {
          fail++;
          errors.push("Linha ignorada: faltam colunas CNPJ/Nome.");
          continue;
        }

        const payload = buildCompanyPayload(r);

        // tenta localizar por CNPJ formatado
        const { data: foundRows, error: findError } = await supabase
          .from("companies")
          .select("id")
          .eq("cnpj", payload.cnpj)
          .limit(1);

        if (findError) {
          fail++;
          errors.push(`Erro ao buscar empresa ${payload.nome}: ${findError.message}`);
          continue;
        }

        const existingId = (foundRows && foundRows[0]?.id) || null;

        if (existingId) {
          const { error: updError } = await supabase
            .from("companies")
            .update({
              nome: payload.nome,
              cidade: payload.cidade,
              email: payload.email,
              telefone: payload.telefone,
              endereco: payload.endereco,
              contato: payload.contato,
              total_vidas: payload.total_vidas,
              total_individual: payload.total_individual,
              total_familiar: payload.total_familiar,
              plano: payload.plano,
              desconto: payload.desconto,
              valor: payload.valor,
              beneficios: payload.beneficios,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingId);

          if (updError) {
            fail++;
            errors.push(`Erro ao atualizar ${payload.nome}: ${updError.message}`);
          } else {
            success++;
          }
        } else {
          const { error: insError } = await supabase
            .from("companies")
            .insert({
              ...payload,
              created_at: new Date().toISOString(),
            });

          if (insError) {
            fail++;
            errors.push(`Erro ao inserir ${payload.nome}: ${insError.message}`);
          } else {
            success++;
          }
        }
      }

      toast.success(`Importação concluída: ${success} sucesso(s), ${fail} falha(s).`);
      if (errors.length) {
        console.warn("Erros na importação:", errors);
      }
      await refetch();
    } catch (err: any) {
      toast.error(`Falha ao ler arquivo: ${err?.message || String(err)}`);
    } finally {
      setIsImporting(false);
      // limpa input
      const input = document.getElementById("import-companies-input") as HTMLInputElement | null;
      if (input) input.value = "";
    }
  };

  const defaultHeaders = [
    "CNPJ",
    "Nome",
    "Cidade",
    "Contato",
    "Email",
    "Telefone",
    "Endereço",
    "Total de Vidas",
    "Total Individual",
    "Total Familiar",
    "Plano",
    "% Desconto",
    "Valor",
  ];

  const mapCompanyValueByHeader = (company: any, header: string) => {
    const hn = normalizeHeader(header);
    if (headerSynonyms.cnpj.includes(hn)) return formatCNPJ(company.cnpj);
    if (headerSynonyms.nome.includes(hn)) return company.nome ?? "";
    if (headerSynonyms.cidade.includes(hn)) return company.cidade ?? "";
    if (headerSynonyms.contato.includes(hn)) return company.contato ?? "";
    if (headerSynonyms.email.includes(hn)) return company.email ?? "";
    if (headerSynonyms.telefone.includes(hn)) return company.telefone ?? "";
    if (headerSynonyms.endereco.includes(hn)) return company.endereco ?? "";
    if (headerSynonyms.total_vidas.includes(hn)) return company.total_vidas ?? 0;
    if (headerSynonyms.total_individual.includes(hn)) return company.total_individual ?? 0;
    if (headerSynonyms.total_familiar.includes(hn)) return company.total_familiar ?? 0;
    if (headerSynonyms.plano.includes(hn)) return company.plano ?? "";
    if (headerSynonyms.desconto.includes(hn)) return company.desconto ?? 0;
    if (headerSynonyms.valor.includes(hn)) return company.valor ?? 0;
    if (headerSynonyms.beneficios_odonto.includes(hn)) return company?.beneficios?.odonto ? "Sim" : "Não";
    if (headerSynonyms.beneficios_seguro_vida.includes(hn)) return company?.beneficios?.seguro_vida ? "Sim" : "Não";
    if (headerSynonyms.beneficios_funeral.includes(hn)) return company?.beneficios?.assistencia_funeral ? "Sim" : "Não";
    if (headerSynonyms.beneficios_clube_descontos.includes(hn)) return company?.beneficios?.clubeDescontos ? "Sim" : "Não";
    if (headerSynonyms.beneficios_clube_descontos_dependente.includes(hn)) return company?.beneficios?.clubeDescontosDependente ? "Sim" : "Não";
    if (headerSynonyms.beneficios_telemedicina.includes(hn)) return company?.beneficios?.telemedicina ? "Sim" : "Não";
    if (headerSynonyms.beneficios_telemedicina_familiar.includes(hn)) return company?.beneficios?.telemedicinaFamiliar ? "Sim" : "Não";
    if (headerSynonyms.beneficios_unimais.includes(hn)) return company?.beneficios?.unimais ? "Sim" : "Não";
    if (headerSynonyms.beneficios_ubook.includes(hn)) return company?.beneficios?.ubook ? "Sim" : "Não";
    return "";
  };

  const handleExportXLSX = async () => {
    try {
      setIsExportingXLSX(true);
      // base de dados: selecionadas ou filtradas
      const ids = new Set(selectedCompanies);
      const base = selectedCompanies.length > 0
        ? filteredCompanies.filter(c => ids.has(c.id))
        : filteredCompanies;
      if (base.length === 0) {
        toast.error("Nenhuma empresa para exportar.");
        return;
      }

      // tentar ler cabeçalho da planilha de teste para replicar modelo
      let templateHeaders = defaultHeaders;
      let tplSheetName = "Empresas";
      try {
        const resp = await fetch("/planilha_teste.xlsx");
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array" });
          tplSheetName = wb.SheetNames[0] || tplSheetName;
          const sh = wb.Sheets[tplSheetName];
          const rows = XLSX.utils.sheet_to_json<string[]>(sh, { header: 1 });
          const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
          if (firstRow.length >= 3) {
            templateHeaders = firstRow.map(h => String(h ?? "").trim());
          }
        }
      } catch (err) {
        // fallback para defaultHeaders
      }

      // constrói linhas seguindo exatamente a ordem dos headers do template
      const aoa: any[][] = [];
      aoa.push(templateHeaders);
      for (const c of base) {
        const row = templateHeaders.map(h => mapCompanyValueByHeader(c, h));
        aoa.push(row);
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tplSheetName);
      const dateStr = new Date().toISOString().slice(0,10);
      XLSX.writeFile(wb, `empresas_${selectedCompanies.length>0?'selecionadas':'filtradas'}_${dateStr}.xlsx`);
    } finally {
      setIsExportingXLSX(false);
    }
  };

  const buildCSV = (rows: any[]) => {
    const headers = [
      "CNPJ",
      "Nome",
      "Cidade",
      "Contato",
      "Email",
      "Telefone",
      "Endereço",
      "Total de Vidas",
      "Total Individual",
      "Total Familiar",
      "Plano",
      "% Desconto",
      "Valor",
      "Benefícios",
    ];
    const delimiter = ";"; // compatível com Excel pt-BR
    const escapeCell = (value: any) => String(value ?? "").replace(/"/g, '""');
    const headerLine = headers.map(h => `"${escapeCell(h)}"`).join(delimiter);
    const dataLines = rows.map((c) => {
      const cells = [
        formatCNPJ(c.cnpj),
        c.nome ?? "",
        c.cidade ?? "",
        c.contato ?? "",
        c.email ?? "",
        c.telefone ?? "",
        c.endereco ?? "",
        c.total_vidas ?? 0,
        c.total_individual ?? 0,
        c.total_familiar ?? 0,
        c.plano ?? "",
        c.desconto ?? 0,
        (c.valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        (() => {
          const b: any = c.beneficios;
          const list: string[] = [];
          if (b?.odonto) list.push("Odonto");
          if (b?.seguro_vida) list.push("Seguro de Vida");
          if (b?.assistencia_funeral) list.push("Assistência Funeral");
          if (b?.clubeDescontos) list.push("Clube de Descontos");
          if (b?.clubeDescontosDependente) list.push("Clube de Descontos Dep.");
          if (b?.telemedicina) list.push("Telemedicina");
          if (b?.telemedicinaFamiliar) list.push("Telemedicina Familiar");
          if (b?.unimais) list.push("Unimais");
          if (b?.ubook) list.push("uBook");
          return list.length ? list.join(", ") : "-";
        })(),
      ];
      return cells.map(v => `"${escapeCell(v)}"`).join(delimiter);
    });
    return [headerLine, ...dataLines].join("\n");
  };

  const handleExportCSV = () => {
    const ids = new Set(selectedCompanies);
    const base = selectedCompanies.length > 0
      ? filteredCompanies.filter(c => ids.has(c.id))
      : filteredCompanies;
    if (base.length === 0) return;
    const csv = buildCSV(base);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `empresas_${selectedCompanies.length>0?'selecionadas':'filtradas'}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId]);
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    }
  };

  const handleEditCompany = (companyId: string) => {
    navigate(`/admin/cadastrar-empresa?edit=${companyId}`);
  };

  const filteredCompanies = companies.filter((company) =>
    company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm) ||
    (company.cidade || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando empresas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas Cadastradas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as empresas cadastradas no sistema
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Dica: selecione empresas para exportar apenas as escolhidas
          </p>
          <div className="flex items-center gap-2">
            {/* Opção de importar XLSX removida conforme solicitado */}
            <Button
              onClick={handleExportXLSX}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isExportingXLSX || (filteredCompanies.length === 0 && selectedCompanies.length === 0)}
            >
              <FileDown className="h-4 w-4" />
              {isExportingXLSX ? "Gerando XLSX..." : "Exportar XLSX"}
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="default"
              size="sm"
              className="gap-2"
              disabled={filteredCompanies.length === 0 && selectedCompanies.length === 0}
            >
              <FileDown className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs whitespace-nowrap w-12"></TableHead>
                <TableHead className="text-xs whitespace-nowrap">CNPJ</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Nome</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Cidade</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Contato</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Email</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Telefone</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Endereço</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total de Vidas</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total Individual</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Total Familiar</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Plano</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">% Desconto</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">Valor</TableHead>
                <TableHead className="text-xs whitespace-nowrap">Benefícios</TableHead>
                <TableHead className="text-xs text-center whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={(checked) => handleSelectCompany(company.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap">{formatCNPJ(company.cnpj)}</TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{company.nome}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.cidade || "-"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.contato || "-"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.email || "-"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.telefone || "-"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.endereco || "-"}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.total_vidas || 0}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.total_individual || 0}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.total_familiar || 0}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{company.plano || "-"}</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">{company.desconto || 0}%</TableCell>
                    <TableCell className="text-xs text-right whitespace-nowrap">
                      {(company.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {(() => {
                        const b: any = company.beneficios;
                        const list: string[] = [];
                        if (b?.odonto) list.push("Odonto");
                        if (b?.seguro_vida) list.push("Seguro de Vida");
                        if (b?.assistencia_funeral) list.push("Assistência Funeral");
                        if (b?.clubeDescontos) list.push("Clube de Descontos");
                        if (b?.clubeDescontosDependente) list.push("Clube de Descontos Dep.");
                        if (b?.telemedicina) list.push("Telemedicina");
                        if (b?.telemedicinaFamiliar) list.push("Telemedicina Familiar");
                        if (b?.unimais) list.push("Unimais");
                        if (b?.ubook) list.push("uBook");
                        return list.length ? list.join(", ") : "-";
                      })()}
                    </TableCell>
                    <TableCell className="text-xs text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCompany(company.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCompanyToDelete({ id: company.id, nome: company.nome });
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-xs text-muted-foreground py-8">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-muted-foreground">
          Total: {filteredCompanies.length} empresa(s)
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa <strong>{companyToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita e todos os beneficiários associados a esta empresa também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (companyToDelete) {
                  deleteCompany.mutate(companyToDelete.id, {
                    onSuccess: () => {
                      setDeleteDialogOpen(false);
                      setCompanyToDelete(null);
                    },
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
