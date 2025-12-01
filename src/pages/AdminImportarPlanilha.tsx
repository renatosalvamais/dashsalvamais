import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCNPJ } from "@/lib/utils";
import { useCompanies } from "@/hooks/useCompanies";

type RowStatus = "pendente" | "sucesso" | "falha" | "parcial";

interface ImportRowLog {
  index: number;
  cnpj: string;
  nomeEmpresa: string;
  cpfTitular: string;
  nomeTitular: string;
  mensagem: string;
  status: RowStatus;
}

const normalizeHeader = (h: unknown) =>
  String(h ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // normaliza separadores comuns para espaço
    .replace(/[_\-]+/g, " ")
    // colapsa múltiplos espaços
    .replace(/\s+/g, " ")
    .trim();

const parseNumber = (v: unknown): number => {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  const num = Number(
    s
      .replace(/[^0-9.,-]/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .replace(/,(?=\d{1,2}$)/, ".")
      .replace(/,/g, "")
  );
  return isNaN(num) ? 0 : num;
};

const parseCurrencyBRL = (v: unknown): number => {
  if (v == null) return 0;
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

const digitsOnly = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export default function AdminImportarPlanilha() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rowsLog, setRowsLog] = useState<ImportRowLog[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState({ total: 0, empresas: 0, beneficiarios: 0, falha: 0, parcial: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { data: companies = [] } = useCompanies();
  const [selectedEmpresa, setSelectedEmpresa] = useState<{
    id: string;
    nome: string;
    cnpj: string;
  } | null>(null);

  const digitsOnly = (v: string) => v.replace(/\D/g, "");

  const filteredEmpresas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const digitsQ = digitsOnly(searchTerm);
    return companies
      .filter((empresa) =>
        empresa.nome.toLowerCase().includes(q) ||
        empresa.cnpj.includes(digitsQ)
      )
      .map((e) => ({ id: e.id, nome: e.nome, cnpj: e.cnpj }));
  }, [companies, searchTerm]);

  const headerSynonymsEmpresa: Record<string, string[]> = {
    cnpj: ["cnpj", "cnpj empresa", "cnpj_empresa"],
    nome: ["nome", "empresa", "razao social", "razaosocial", "nome empresa", "nome_empresa"],
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
    beneficios_clube_descontos: [
      "clube de descontos",
      "clube descontos",
      // variações comuns na planilha
      "descontos",
      "descontos titular",
    ],
    beneficios_clube_descontos_dependente: [
      "clube de descontos dependente",
      "clube descontos dependente",
      "clube de descontos dep",
      "clube descontos dep",
      // variações comuns na planilha
      "descontos dependente",
    ],
    beneficios_telemedicina: ["telemedicina", "telemedicina titular"],
    beneficios_telemedicina_familiar: [
      "telemedicina familiar",
      "telemedicina fam",
      "telemedicina dependente",
    ],
    beneficios_unimais: ["unimais"],
    beneficios_ubook: ["ubook", "u book", "u-book"],
  };

  const headerSynonymsBenef: Record<string, string[]> = {
    cnpj_empresa: ["cnpj", "cnpj empresa", "cnpj_empresa"],
    nome_empresa: ["nome empresa", "nome_empresa", "empresa"],
    cpf: ["cpf", "cpf titular", "cpf_titular", "cpf beneficiario", "cpf_beneficiario"],
    nome: ["nome titular", "nome_titular", "titular", "nome beneficiario", "nome_beneficiario"],
    telefone: ["telefone", "celular", "whatsapp"],
    dependentes: ["dependentes", "qtde dependentes", "qtd dependentes"],
    status: ["status", "situacao", "situação"],
    ativo: ["ativo", "inativo"],
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
    const odonto = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_odonto);
    const seguro = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_seguro_vida);
    const funeral = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_funeral);
    // Novos benefícios
    const clubeDescontos = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_clube_descontos);
    const clubeDescontosDep = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_clube_descontos_dependente);
    const telemedicina = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_telemedicina);
    const telemedicinaFam = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_telemedicina_familiar);
    const unimais = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_unimais);
    const ubook = getBooleanBySynonyms(row, headerSynonymsEmpresa.beneficios_ubook);
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
    const rawCnpj = getValueBySynonyms(row, headerSynonymsEmpresa.cnpj) ?? "";
    const digits = digitsOnly(rawCnpj);
    const cnpjFormatted = digits.length === 14 ? formatCNPJ(digits) : String(rawCnpj);
    return {
      cnpj: cnpjFormatted,
      nome: getValueBySynonyms(row, headerSynonymsEmpresa.nome) ?? "",
      cidade: (getValueBySynonyms(row, headerSynonymsEmpresa.cidade) as string | undefined) ?? null,
      email: (getValueBySynonyms(row, headerSynonymsEmpresa.email) as string | undefined) ?? null,
      telefone: (getValueBySynonyms(row, headerSynonymsEmpresa.telefone) as string | undefined) ?? null,
      endereco: (getValueBySynonyms(row, headerSynonymsEmpresa.endereco) as string | undefined) ?? null,
      contato: (getValueBySynonyms(row, headerSynonymsEmpresa.contato) as string | undefined) ?? null,
      total_vidas: parseNumber(getValueBySynonyms(row, headerSynonymsEmpresa.total_vidas)),
      total_individual: parseNumber(getValueBySynonyms(row, headerSynonymsEmpresa.total_individual)),
      total_familiar: parseNumber(getValueBySynonyms(row, headerSynonymsEmpresa.total_familiar)),
      plano: (getValueBySynonyms(row, headerSynonymsEmpresa.plano) as string | undefined) ?? null,
      desconto: parseNumber(getValueBySynonyms(row, headerSynonymsEmpresa.desconto)),
      valor: parseCurrencyBRL(getValueBySynonyms(row, headerSynonymsEmpresa.valor)),
      beneficios: buildBenefits(row),
    } as const;
  };

  const buildBeneficiaryPayload = (row: Record<string, any>, companyId: string | null) => {
    const rawCpf = getValueBySynonyms(row, headerSynonymsBenef.cpf) ?? "";
    const cpf = digitsOnly(rawCpf);
    const nome = (getValueBySynonyms(row, headerSynonymsBenef.nome) as string | undefined) ?? "";
    const telefone = (getValueBySynonyms(row, headerSynonymsBenef.telefone) as string | undefined) ?? null;
    const dependentes = parseNumber(getValueBySynonyms(row, headerSynonymsBenef.dependentes));
    const status = (getValueBySynonyms(row, headerSynonymsBenef.status) as string | undefined) ?? null;
    const ativo = getBooleanBySynonyms(row, headerSynonymsBenef.ativo);
    return {
      cpf,
      nome,
      telefone,
      dependentes: Number.isFinite(dependentes) ? dependentes : null,
      status,
      ativo: ativo === null ? null : ativo,
      company_id: companyId,
    } as const;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (!file) return;
    setIsReading(true);
    (async () => {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!rows || rows.length === 0) {
          toast.error("Planilha vazia ou inválida.");
          setRowsLog([]);
          setSummary({ total: 0, empresas: 0, beneficiarios: 0, falha: 0, parcial: 0 });
          return;
        }

        const logs: ImportRowLog[] = (rows as Record<string, any>[]).map((r, idx) => {
          const cnpjRaw = getValueBySynonyms(r, headerSynonymsEmpresa.cnpj) ?? getValueBySynonyms(r, headerSynonymsBenef.cnpj_empresa) ?? "";
          const cnpjDigits = digitsOnly(cnpjRaw);
          const cnpj = cnpjDigits.length === 14 ? formatCNPJ(cnpjDigits) : String(cnpjRaw);
          const nomeEmpresa = (getValueBySynonyms(r, headerSynonymsEmpresa.nome) as string | undefined) ?? ((getValueBySynonyms(r, headerSynonymsBenef.nome_empresa) as string | undefined) ?? "");
          const cpfTitular = digitsOnly(getValueBySynonyms(r, headerSynonymsBenef.cpf) ?? "");
          const nomeTitular = (getValueBySynonyms(r, headerSynonymsBenef.nome) as string | undefined) ?? "";
          return {
            index: idx + 1,
            cnpj,
            nomeEmpresa,
            cpfTitular,
            nomeTitular,
            mensagem: "",
            status: "pendente",
          };
        });
        setRowsLog(logs);
        setSummary({ total: logs.length, empresas: 0, beneficiarios: 0, falha: 0, parcial: 0 });
      } catch (err: any) {
        toast.error(`Falha ao ler arquivo: ${err?.message || String(err)}`);
      } finally {
        setIsReading(false);
      }
    })();
  };

  const handleRead = async () => {
    if (!selectedFile) return;
    setIsReading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!rows || rows.length === 0) {
        toast.error("Planilha vazia ou inválida.");
        setRowsLog([]);
        return;
      }

      const logs: ImportRowLog[] = (rows as Record<string, any>[]).map((r, idx) => {
        const cnpjRaw = getValueBySynonyms(r, headerSynonymsEmpresa.cnpj) ?? getValueBySynonyms(r, headerSynonymsBenef.cnpj_empresa) ?? "";
        const cnpjDigits = digitsOnly(cnpjRaw);
        const cnpj = cnpjDigits.length === 14 ? formatCNPJ(cnpjDigits) : String(cnpjRaw);
        const nomeEmpresa = (getValueBySynonyms(r, headerSynonymsEmpresa.nome) as string | undefined) ?? ((getValueBySynonyms(r, headerSynonymsBenef.nome_empresa) as string | undefined) ?? "");
        const cpfTitular = digitsOnly(getValueBySynonyms(r, headerSynonymsBenef.cpf) ?? "");
        const nomeTitular = (getValueBySynonyms(r, headerSynonymsBenef.nome) as string | undefined) ?? "";
        return {
          index: idx + 1,
          cnpj,
          nomeEmpresa,
          cpfTitular,
          nomeTitular,
          mensagem: "",
          status: "pendente",
        };
      });
      setRowsLog(logs);
      setSummary({ total: logs.length, empresas: 0, beneficiarios: 0, falha: 0, parcial: 0 });
    } catch (err: any) {
      toast.error(`Falha ao ler arquivo: ${err?.message || String(err)}`);
    } finally {
      setIsReading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || rowsLog.length === 0) return;
    if (!selectedEmpresa) {
      toast.error("Selecione uma empresa antes de importar!");
      return;
    }
    setIsImporting(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, any>[];

      let empresasOk = 0;
      let benefOk = 0;
      let falha = 0;
      let parcial = 0;

      const cnpjCache = new Map<string, string>(); // cnpj -> company_id

      const newLogs: ImportRowLog[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const idx = i + 1;
        const cnpjRaw = getValueBySynonyms(r, headerSynonymsEmpresa.cnpj) ?? getValueBySynonyms(r, headerSynonymsBenef.cnpj_empresa) ?? "";
        const cnpjDigits = digitsOnly(cnpjRaw);
        const cnpjFormatted = cnpjDigits.length === 14 ? formatCNPJ(cnpjDigits) : String(cnpjRaw);
        const nomeEmp = (getValueBySynonyms(r, headerSynonymsEmpresa.nome) as string | undefined) ?? ((getValueBySynonyms(r, headerSynonymsBenef.nome_empresa) as string | undefined) ?? "");

        let companyId: string | null = null;
        let companyMsg = "";
        let companySucceeded = false;

        // Se houver CNPJ/Nome da empresa, faz upsert
        const hasCompanyData = !!(cnpjDigits || nomeEmp);
        if (hasCompanyData) {
          try {
            if (cnpjDigits && cnpjCache.has(cnpjFormatted)) {
              companyId = cnpjCache.get(cnpjFormatted) || null;
              companySucceeded = true; // já existe no cache, assume ok
            } else {
              const payload = buildCompanyPayload(r);
              // busca empresa por cnpj
              const { data: foundRows, error: findError } = await supabase
                .from("companies")
                .select("id")
                .eq("cnpj", payload.cnpj)
                .limit(1);
              if (findError) throw new Error(findError.message);
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
                if (updError) throw new Error(updError.message);
                companyId = existingId;
                companyMsg = "Empresa atualizada";
              } else {
                const { data: insData, error: insError } = await supabase
                  .from("companies")
                  .insert({
                    ...payload,
                    created_at: new Date().toISOString(),
                  })
                  .select("id")
                  .limit(1);
                if (insError) throw new Error(insError.message);
                companyId = (insData && insData[0]?.id) || null;
                companyMsg = "Empresa criada";
              }
              if (cnpjDigits && companyId) cnpjCache.set(cnpjFormatted, companyId);
              companySucceeded = true;
              empresasOk++;
            }
          } catch (err: any) {
            companyMsg = `Falha empresa: ${err?.message || String(err)}`;
            companySucceeded = false;
          }
        }

        // Se houver CPF/Nome titular, faz upsert de beneficiário
        const rawCpf = getValueBySynonyms(r, headerSynonymsBenef.cpf) ?? "";
        const cpf = digitsOnly(rawCpf);
        const nomeTit = (getValueBySynonyms(r, headerSynonymsBenef.nome) as string | undefined) ?? "";
        const hasBenefData = !!cpf || !!nomeTit;
        let benefMsg = "";
        let benefSucceeded = false;
        if (hasBenefData) {
          try {
            const benefPayload = buildBeneficiaryPayload(r, companyId);
            if (!benefPayload.cpf) throw new Error("CPF do beneficiário ausente ou inválido");
            // busca por cpf + company_id
            const { data: foundBens, error: findBenError } = await supabase
              .from("beneficiaries")
              .select("id")
              .eq("cpf", benefPayload.cpf)
              .eq("company_id", benefPayload.company_id)
              .limit(1);
            if (findBenError) throw new Error(findBenError.message);
            const existingBenId = (foundBens && foundBens[0]?.id) || null;
            if (existingBenId) {
              const { error: updBenErr } = await supabase
                .from("beneficiaries")
                .update({
                  nome: benefPayload.nome,
                  telefone: benefPayload.telefone,
                  dependentes: benefPayload.dependentes,
                  status: benefPayload.status,
                  ativo: benefPayload.ativo,
                })
                .eq("id", existingBenId);
              if (updBenErr) throw new Error(updBenErr.message);
              benefMsg = "Beneficiário atualizado";
            } else {
              const { error: insBenErr } = await supabase
                .from("beneficiaries")
                .insert({
                  ...benefPayload,
                  created_at: new Date().toISOString(),
                });
              if (insBenErr) throw new Error(insBenErr.message);
              benefMsg = "Beneficiário criado";
            }
            benefSucceeded = true;
            benefOk++;
          } catch (err: any) {
            benefMsg = `Falha beneficiário: ${err?.message || String(err)}`;
            benefSucceeded = false;
          }
        }

        const status: RowStatus = hasCompanyData && hasBenefData
          ? (companySucceeded && benefSucceeded ? "sucesso" : (!companySucceeded && !benefSucceeded ? "falha" : "parcial"))
          : ((companySucceeded || benefSucceeded) ? "sucesso" : "falha");
        if (status === "falha") falha++;
        if (status === "parcial") parcial++;

        newLogs.push({
          index: idx,
          cnpj: cnpjFormatted,
          nomeEmpresa: nomeEmp,
          cpfTitular: cpf,
          nomeTitular: nomeTit,
          mensagem: [companyMsg, benefMsg].filter(Boolean).join(" | "),
          status,
        });
      }

      setRowsLog(newLogs);
      setSummary({ total: newLogs.length, empresas: empresasOk, beneficiarios: benefOk, falha, parcial });
      toast.success("Importação unificada concluída.");
    } catch (err: any) {
      toast.error(`Falha ao importar: ${err?.message || String(err)}`);
    } finally {
      setIsImporting(false);
      const input = document.getElementById("file-upload-unified") as HTMLInputElement | null;
      if (input) input.value = "";
    }
  };

  const clearAll = () => {
    setSelectedFile(null);
    setRowsLog([]);
    setSummary({ total: 0, empresas: 0, beneficiarios: 0, falha: 0, parcial: 0 });
    const input = document.getElementById("file-upload-unified") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleDownloadLogCSV = () => {
    if (rowsLog.length === 0) return;
    const delimiter = ";";
    const headers = [
      "#",
      "CNPJ",
      "Empresa",
      "CPF Titular",
      "Nome Titular",
      "Status",
      "Mensagem",
    ];
    const escapeCell = (value: any) => String(value ?? "").replace(/"/g, '""');
    const headerLine = headers.map(h => `"${escapeCell(h)}"`).join(delimiter);
    const dataLines = rowsLog.map(l => [
      l.index,
      l.cnpj,
      l.nomeEmpresa,
      l.cpfTitular,
      l.nomeTitular,
      l.status,
      l.mensagem,
    ].map(v => `"${escapeCell(v)}"`).join(delimiter));
    const csv = [headerLine, ...dataLines].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `import_log_unificado_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importar Planilha (Unificado)</h1>
          <p className="text-sm text-muted-foreground">Uma única planilha para empresas e beneficiários</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="file-upload-unified" className="text-sm">Selecione a planilha</Label>
            <div className="flex items-center gap-4">
              <a
                href="/planilha_teste.xlsx"
                download
                className="text-xs text-primary hover:underline flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Modelo Empresas
              </a>
              <a
                href="/templates/beneficiary_template.xlsx"
                download
                className="text-xs text-primary hover:underline flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Modelo Beneficiários
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input
              id="file-upload-unified"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="flex-1"
            />
            {/* Botão Ler removido: leitura automática ao selecionar arquivo */}
            <Button onClick={handleImport} variant="search" disabled={!selectedFile || rowsLog.length === 0 || isReading || isImporting} className="gap-2">
              <Upload className="h-4 w-4" />
              {isImporting ? "Importando..." : "Importar"}
            </Button>
            <Button onClick={handleDownloadLogCSV} variant="outline" disabled={rowsLog.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar log CSV
            </Button>
            <Button onClick={clearAll} variant="ghost">Limpar</Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Total linhas: {summary.total} | Empresas OK: {summary.empresas} | Beneficiários OK: {summary.beneficiarios} | Parcial: {summary.parcial} | Falhas: {summary.falha}
          </div>
        </div>

        <div className="border rounded-lg bg-card overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-xs font-semibold">#</th>
                <th className="text-left p-2 text-xs font-semibold">CNPJ Empresa</th>
                <th className="text-left p-2 text-xs font-semibold">Nome Empresa</th>
                <th className="text-left p-2 text-xs font-semibold">CPF Titular</th>
                <th className="text-left p-2 text-xs font-semibold">Nome Titular</th>
                <th className="text-left p-2 text-xs font-semibold">Status</th>
                <th className="text-left p-2 text-xs font-semibold">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {rowsLog.length > 0 ? (
                rowsLog.map((log) => (
                  <tr key={log.index} className="border-b border-border">
                    <td className="p-2 text-xs">{log.index}</td>
                    <td className="p-2 text-xs font-mono">{log.cnpj || "-"}</td>
                    <td className="p-2 text-xs">{log.nomeEmpresa || "-"}</td>
                    <td className="p-2 text-xs font-mono">{log.cpfTitular || "-"}</td>
                    <td className="p-2 text-xs">{log.nomeTitular || "-"}</td>
                    <td className="p-2 text-xs">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        log.status === "sucesso"
                          ? "bg-success/20 text-success"
                          : log.status === "parcial"
                          ? "bg-warning/20 text-warning"
                          : "bg-destructive/20 text-destructive"
                      }`}>
                    {log.status === "sucesso" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" /> Sucesso
                      </>
                    ) : log.status === "parcial" ? (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" /> Parcial
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" /> Lido
                      </>
                    )}
                  </span>
                </td>
                    <td className="p-2 text-xs">{log.mensagem || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-xs text-muted-foreground py-8">Nenhum log gerado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
