import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { formatCNPJ } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RowStatus = "pendente" | "sucesso" | "falha";

interface ImportRowLog {
  index: number;
  cnpj_empresa: string;
  nome_empresa: string;
  nome_titular: string;
  cpf_titular: string;
  mensagem: string;
  status: RowStatus;
}

const normalizeHeader = (h: unknown) =>
  String(h ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toBoolSIMNAO = (v: unknown): boolean => {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "sim" || s === "s" || s === "true";
};

const parseDigits = (v: unknown): string => String(v ?? "").replace(/\D/g, "");

export default function AdminImportarBeneficiarios() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rowsLog, setRowsLog] = useState<ImportRowLog[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState({ total: 0, sucesso: 0, falha: 0 });

  const readFile = async (file: File) => {
    setIsReading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!rows || rows.length === 0) {
        toast.error("Planilha vazia ou inválida.");
        setRowsLog([]);
        setRawRows([]);
        setSummary({ total: 0, sucesso: 0, falha: 0 });
        return;
      }

      const logs: ImportRowLog[] = (rows as Record<string, any>[]).map((r, idx) => {
        // capturar os campos conforme modelo fornecido
        const cnpj_empresa = r["cnpj_empresa"] ?? r["CNPJ"] ?? r["cnpj"] ?? "";
        const nome_empresa = r["nome_empresa"] ?? r["empresa"] ?? r["nome"] ?? "";
        const nome_titular = r["nome_titular"] ?? r["titular"] ?? "";
        const cpf_titular = r["cpf_titular"] ?? r["cpf"] ?? "";

        const hasMin = Boolean(cnpj_empresa && nome_titular && cpf_titular);
        return {
          index: idx + 1,
          cnpj_empresa: String(cnpj_empresa),
          nome_empresa: String(nome_empresa),
          nome_titular: String(nome_titular),
          cpf_titular: String(cpf_titular),
          mensagem: hasMin ? "Pendente" : "Faltam campos obrigatórios (CNPJ/Nome Titular/CPF)",
          status: hasMin ? "pendente" : "falha",
        };
      });
      const falha = logs.filter(l => l.status === "falha").length;
      setRowsLog(logs);
      setRawRows(rows as Record<string, any>[]);
      setSummary({ total: logs.length, sucesso: 0, falha });
      toast.success(`Lidas ${logs.length} linha(s). ${falha} com problema(s) inicial(s).`);
    } catch (err: any) {
      toast.error(`Erro ao ler arquivo: ${err?.message || String(err)}`);
    } finally {
      setIsReading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) await readFile(file);
  };

  const ensureCompany = async (cnpjRaw: string, nomeEmpresa: string) => {
    const digits = parseDigits(cnpjRaw);
    const cnpj = digits.length === 14 ? formatCNPJ(digits) : cnpjRaw;
    const { data: found, error: findErr } = await supabase.from("companies").select("id").eq("cnpj", cnpj).limit(1);
    if (findErr) throw new Error(findErr.message);
    const cid = found && found[0]?.id;
    if (cid) return { id: cid, cnpj };
    const { data: ins, error: insErr } = await supabase
      .from("companies")
      .insert({ cnpj, nome: nomeEmpresa, created_at: new Date().toISOString() })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { id: ins.id, cnpj };
  };

  const upsertBeneficiary = async (payload: {
    company_id: string;
    nome: string;
    cpf: string;
    telefone?: string | null;
    status?: string | null;
    ativo?: boolean | null;
    dependentes?: number | null;
  }) => {
    // Procurar por CPF
    const { data: found, error: findErr } = await supabase
      .from("beneficiaries")
      .select("id")
      .eq("cpf", payload.cpf)
      .limit(1);
    if (findErr) throw new Error(findErr.message);
    const bid = found && found[0]?.id;
    if (bid) {
      const { error: updErr } = await supabase
        .from("beneficiaries")
        .update({
          company_id: payload.company_id,
          nome: payload.nome,
          telefone: payload.telefone ?? null,
          status: payload.status ?? null,
          dependentes: payload.dependentes ?? null,
          ativo: payload.ativo ?? true,
        })
        .eq("id", bid);
      if (updErr) throw new Error(updErr.message);
      return bid;
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("beneficiaries")
        .insert({
          company_id: payload.company_id,
          nome: payload.nome,
          cpf: payload.cpf,
          telefone: payload.telefone ?? null,
          status: payload.status ?? null,
          dependentes: payload.dependentes ?? null,
          ativo: payload.ativo ?? true,
          created_at: new Date().toISOString() as any,
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      return ins.id;
    }
  };

  const handleImport = async () => {
    if (!selectedFile || rowsLog.length === 0) return;
    setIsImporting(true);
    try {
      let sucesso = 0;
      let falha = 0;
      const logs = [...rowsLog];
      for (let i = 0; i < logs.length; i++) {
        let mensagem = "";
        try {
          const log = logs[i];
          const row = rawRows[i];

          // Campos principais conforme modelo fornecido
          const cnpj_empresa = row["cnpj_empresa"] ?? row["CNPJ"] ?? row["cnpj"] ?? "";
          const nome_empresa = row["nome_empresa"] ?? row["empresa"] ?? row["nome"] ?? "";
          const nome_titular = row["nome_titular"] ?? row["titular"] ?? "";
          const cpf_titular = row["cpf_titular"] ?? row["cpf"] ?? "";
          const telefone_titular = row["telefone_titular"] ?? row["telefone"] ?? null;
          const remover = row["remover"] ?? "N";

          if (!cnpj_empresa || !nome_titular || !cpf_titular) {
            throw new Error("Faltam campos obrigatórios (CNPJ/Nome Titular/CPF)");
          }

          // Garantir empresa
          const { id: company_id } = await ensureCompany(String(cnpj_empresa), String(nome_empresa || "Empresa"));

          // Dependentes presentes
          const depNames = [row["nome_dependente_1"], row["nome_dependente_2"], row["nome_dependente_3"]];
          const depCpfs = [row["cpf_dependente_1"], row["cpf_dependente_2"], row["cpf_dependente_3"]];
          const dependentesCount = depNames.filter((n) => String(n || "").trim().length > 0).length;

          // Titular
          await upsertBeneficiary({
            company_id,
            nome: String(nome_titular),
            cpf: parseDigits(cpf_titular),
            telefone: telefone_titular ? String(telefone_titular) : null,
            status: "titular",
            ativo: !toBoolSIMNAO(remover),
            dependentes: dependentesCount || null,
          });

          // Dependentes (se houver)
          for (let di = 0; di < 3; di++) {
            const ndep = String(depNames[di] || "").trim();
            const cdep = parseDigits(depCpfs[di]);
            if (ndep && cdep) {
              await upsertBeneficiary({
                company_id,
                nome: ndep,
                cpf: cdep,
                telefone: null,
                status: "dependente",
                ativo: true,
                dependentes: 0,
              });
            }
          }

          logs[i] = { ...log, status: "sucesso", mensagem: "Importado" };
          sucesso++;
        } catch (e: any) {
          mensagem = e?.message || String(e);
          logs[i] = { ...logs[i], status: "falha", mensagem };
          falha++;
        }
        setRowsLog([...logs]);
      }
      setSummary({ total: logs.length, sucesso, falha });
      toast.success(`Importação: ${sucesso} sucesso(s), ${falha} falha(s).`);
    } catch (err: any) {
      toast.error(`Falha na importação: ${err?.message || String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadLogCSV = () => {
    if (rowsLog.length === 0) return;
    const headers = ["Linha", "CNPJ Empresa", "Nome Empresa", "Titular", "CPF", "Status", "Mensagem"];
    const delimiter = ";";
    const esc = (v: any) => String(v ?? "").replace(/"/g, '""');
    const lines = rowsLog.map(l => [l.index, l.cnpj_empresa, l.nome_empresa, l.nome_titular, l.cpf_titular, l.status, l.mensagem].map(v => `"${esc(v)}"`).join(delimiter));
    const csv = [headers.map(h => `"${esc(h)}"`).join(delimiter), ...lines].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_log_beneficiarios_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setSelectedFile(null);
    setRowsLog([]);
    setRawRows([]);
    setSummary({ total: 0, sucesso: 0, falha: 0 });
    const input = document.getElementById("file-upload-beneficiarios") as HTMLInputElement | null;
    if (input) input.value = "";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importar Beneficiários (XLSX)</h1>
          <p className="text-sm text-muted-foreground">Envie sua planilha no modelo informado e acompanhe os logs por linha.</p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="file-upload-beneficiarios" className="text-sm">Selecione a planilha</Label>
            <a href="/planilha_teste.xlsx" download className="text-xs text-primary hover:underline flex items-center gap-2">
              <Download className="h-3 w-3" />
              Baixar modelo (teste)
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Input
              id="file-upload-beneficiarios"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={handleImport}
              variant="search"
              disabled={!selectedFile || rowsLog.length === 0 || isReading || isImporting}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? "Importando..." : "Importar"}
            </Button>
            <Button onClick={downloadLogCSV} variant="outline" disabled={rowsLog.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar log CSV
            </Button>
            <Button onClick={clearAll} variant="ghost" disabled={isReading || isImporting}>
              Limpar
            </Button>
          </div>

          {selectedFile && (
            <p className="text-xs text-muted-foreground">
              Arquivo: <span className="font-semibold">{selectedFile.name}</span>
            </p>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">Logs de Importação</h2>
          <div className="flex items-center gap-4 text-xs mb-4">
            <span>Total: {summary.total}</span>
            <span className="text-success">Sucesso: {summary.sucesso}</span>
            <span className="text-destructive">Falha: {summary.falha}</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs whitespace-nowrap">Linha</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">CNPJ Empresa</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Empresa</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Titular</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">CPF</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsLog.length > 0 ? (
                  rowsLog.map((log) => (
                    <TableRow key={log.index}>
                      <TableCell className="text-xs whitespace-nowrap">{log.index}</TableCell>
                      <TableCell className="text-xs font-mono whitespace-nowrap">{log.cnpj_empresa}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{log.nome_empresa}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{log.nome_titular}</TableCell>
                      <TableCell className="text-xs font-mono whitespace-nowrap">{log.cpf_titular}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {log.status === "sucesso" ? (
                          <span className="inline-flex items-center gap-1 text-success"><CheckCircle className="h-3 w-3" /> Sucesso</span>
                        ) : log.status === "falha" ? (
                          <span className="inline-flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" /> Falha</span>
                        ) : (
                          <span className="text-muted-foreground">Pendente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{log.mensagem}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      Nenhum log disponível. Selecione um arquivo acima.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}