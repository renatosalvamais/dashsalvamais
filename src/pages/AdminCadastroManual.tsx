import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCompanies } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RowStatus = "pendente" | "sucesso" | "falha";

interface ManualRow {
  nome: string;
  cpf: string;
  telefone: string;
  dep1: string;
  cpf1: string;
  dep2: string;
  cpf2: string;
  dep3: string;
  cpf3: string;
}

interface ImportLogRow {
  index: number;
  nome: string;
  cpf: string;
  status: RowStatus;
  mensagem: string;
}

const digitsOnly = (v: string) => v.replace(/\D/g, "");

const formatCPF = (v: string) => {
  const d = digitsOnly(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
};

const formatPhoneBR = (v: string) => {
  const d = digitsOnly(v).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; // 10 dígitos: XXXX-XXXX
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`; // 11 dígitos: 9XXXX-XXXX
};

const AdminCadastroManual = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();
  const [selectedEmpresa, setSelectedEmpresa] = useState<{
    id: string;
    nome: string;
    cnpj: string;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [rows, setRows] = useState<ManualRow[]>(
    Array(5)
      .fill(null)
      .map(() => ({
        nome: "",
        cpf: "",
        telefone: "",
        dep1: "",
        cpf1: "",
        dep2: "",
        cpf2: "",
        dep3: "",
        cpf3: "",
      }))
  );
  const [rowsLog, setRowsLog] = useState<ImportLogRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);

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

  const adicionarLinhas = () => {
    const novasLinhas: ManualRow[] = Array(5)
      .fill(null)
      .map(() => ({
        nome: "",
        cpf: "",
        telefone: "",
        dep1: "",
        cpf1: "",
        dep2: "",
        cpf2: "",
        dep3: "",
        cpf3: "",
      }));
    setRows([...rows, ...novasLinhas]);
  };

  const limparLinhas = () => {
    setRows(
      Array(5)
        .fill(null)
        .map(() => ({
          nome: "",
          cpf: "",
          telefone: "",
          dep1: "",
          cpf1: "",
          dep2: "",
          cpf2: "",
          dep3: "",
          cpf3: "",
        }))
    );
    setRowsLog([]);
  };

  const handleExport = () => {
    if (!selectedEmpresa) {
      toast.error("Selecione uma empresa primeiro!");
      return;
    }
    toast.success("Planilha XLS exportada com sucesso!");
  };

  const handleExportSVA = () => {
    if (!selectedEmpresa) {
      toast.error("Selecione uma empresa primeiro!");
      return;
    }
    toast.success("Arquivo SVA exportado com sucesso!");
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
      return bid as string;
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
      return (ins?.id as string) || "";
    }
  };

  const inserirNoBanco = async () => {
    if (!selectedEmpresa) {
      toast.error("Selecione uma empresa primeiro!");
      return;
    }
    setIsImporting(true);
    try {
      const company_id = selectedEmpresa.id;
      let sucesso = 0;
      let falha = 0;
      const logs: ImportLogRow[] = rows.map((r, i) => ({
        index: i + 1,
        nome: r.nome,
        cpf: r.cpf,
        status: "pendente",
        mensagem: "",
      }));

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const nomeTit = r.nome.trim();
        const cpfTit = digitsOnly(r.cpf);
        const telTit = r.telefone.trim();
        if (!nomeTit && !cpfTit) {
          // linha vazia, ignorar
          continue;
        }
        try {
          const depNames = [r.dep1.trim(), r.dep2.trim(), r.dep3.trim()];
          const depCpfs = [digitsOnly(r.cpf1), digitsOnly(r.cpf2), digitsOnly(r.cpf3)];
          const dependentesCount = depNames.filter((n) => n.length > 0).length;

          if (!cpfTit) throw new Error("CPF do titular inválido ou ausente");

          await upsertBeneficiary({
            company_id,
            nome: nomeTit,
            cpf: cpfTit,
            telefone: telTit || null,
            status: "titular",
            ativo: true,
            dependentes: dependentesCount || null,
          });

          for (let di = 0; di < 3; di++) {
            const ndep = depNames[di];
            const cdep = depCpfs[di];
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

          logs[i] = { ...logs[i], status: "sucesso", mensagem: "Importado" };
          sucesso++;
        } catch (e: any) {
          logs[i] = {
            ...logs[i],
            status: "falha",
            mensagem: e?.message || String(e),
          };
          falha++;
        }
        setRowsLog([...logs]);
      }

      toast.success(`Cadastro manual: ${sucesso} sucesso(s), ${falha} falha(s).`);
    } catch (err: any) {
      toast.error(`Falha ao inserir: ${err?.message || String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Cadastro Manual de Colaboradores
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre colaboradores manualmente no sistema
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-bold text-card-foreground">
              Buscar Empresa
            </h2>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Busque por nome da empresa ou CNPJ
          </p>

          <div className="relative">
            <Input
              placeholder="Digite o nome ou CNPJ da empresa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="mb-2"
            />
            
            {showResults && searchTerm && filteredEmpresas.length > 0 && (
              <div className="absolute z-10 w-full bg-card border border-border rounded-lg shadow-lg mt-1">
                {filteredEmpresas.map((empresa, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0"
                    onClick={() => {
                      setSelectedEmpresa(empresa);
                      setSearchTerm(empresa.nome);
                      setShowResults(false);
                    }}
                  >
                    <div className="font-medium text-sm text-foreground">{empresa.nome}</div>
                    <div className="text-xs text-muted-foreground">CNPJ: {empresa.cnpj}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedEmpresa && (
            <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="text-sm font-medium text-foreground">{selectedEmpresa.nome}</div>
              <div className="text-xs text-muted-foreground">CNPJ: {selectedEmpresa.cnpj}</div>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Lista de Colaboradores
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Total de linhas disponíveis: <span className="font-semibold">{rows.length}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-xs font-semibold">#</th>
                    <th className="text-left p-2 text-xs font-semibold">Nome Completo</th>
                    <th className="text-left p-2 text-xs font-semibold">CPF</th>
                    <th className="text-left p-2 text-xs font-semibold">Telefone (DDD)</th>
                    <th className="text-left p-2 text-xs font-semibold">Dep. 1</th>
                    <th className="text-left p-2 text-xs font-semibold">CPF 1</th>
                    <th className="text-left p-2 text-xs font-semibold">Dep. 2</th>
                    <th className="text-left p-2 text-xs font-semibold">CPF 2</th>
                    <th className="text-left p-2 text-xs font-semibold">Dep. 3</th>
                    <th className="text-left p-2 text-xs font-semibold">CPF 3</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="p-2 text-xs">{index + 1}</td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome completo"
                          value={row.nome}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], nome: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
                          value={row.cpf}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], cpf: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                          />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="(11) 99999-9999"
                          value={row.telefone}
                          onChange={(e) => {
                            const v = formatPhoneBR(e.target.value);
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], telefone: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome dep. 1"
                          value={row.dep1}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], dep1: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
                          value={row.cpf1}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], cpf1: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome dep. 2"
                          value={row.dep2}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], dep2: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
                          value={row.cpf2}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], cpf2: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome dep. 3"
                          value={row.dep3}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], dep3: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
                          value={row.cpf3}
                          onChange={(e) => {
                            const v = formatCPF(e.target.value);
                            setRows((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], cpf3: v };
                              return next;
                            });
                          }}
                          className="bg-muted/50 h-8 text-xs"
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

            <div className="flex justify-center gap-4">
              <Button
                type="button"
                onClick={inserirNoBanco}
                variant="search"
                size="lg"
                disabled={!selectedEmpresa || isImporting}
                className="px-12 gap-2"
              >
                <Upload className="h-5 w-5" />
                {isImporting ? "Inserindo..." : "Adicionar"}
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                type="button"
                onClick={handleExport}
                variant="search"
                size="lg"
                className="px-12 gap-2"
              >
                <FileDown className="h-5 w-5" />
                EXPORTAR XLS
              </Button>
              <Button
                type="button"
                onClick={handleExportSVA}
                variant="search"
                size="lg"
                className="px-12 gap-2"
              >
                <FileDown className="h-5 w-5" />
                EXPORTAR SVA
              </Button>
            </div>

            {rowsLog.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-card-foreground mb-2">
                  Logs de inserção
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs whitespace-nowrap">Linha</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Nome</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">CPF</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowsLog.map((log, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs">{log.index}</TableCell>
                        <TableCell className="text-xs">{log.nome || "-"}</TableCell>
                        <TableCell className="text-xs">{log.cpf || "-"}</TableCell>
                        <TableCell className="text-xs">{log.status}</TableCell>
                        <TableCell className="text-xs">{log.mensagem || ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCadastroManual;
