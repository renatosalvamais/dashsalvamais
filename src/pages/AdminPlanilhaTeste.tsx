import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface PreviewRow {
  cells: (string | number | null)[];
}

export default function AdminPlanilhaTeste() {
  const [sheetName, setSheetName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadXlsx = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/planilha_teste.xlsx");
        if (!res.ok) throw new Error(`Falha ao carregar planilha: ${res.status}`);
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        setSheetName(firstSheet);
        const ws = wb.Sheets[firstSheet];
        const data = XLSX.utils.sheet_to_json<(string | number | null)[]>({
          Sheet: ws,
        } as any, { header: 1 });

        const rowsArray = Array.isArray(data) ? data : [];
        const head = (rowsArray[0] ?? []) as (string | number | null)[];
        const headerStrings = head.map((h) => String(h ?? ""));
        const body = rowsArray.slice(1).map((r) => ({ cells: r }));

        setHeaders(headerStrings);
        setRows(body.slice(0, 50)); // limita preview a 50 linhas
      } catch (e: any) {
        setError(e?.message ?? "Erro desconhecido ao ler planilha");
      } finally {
        setIsLoading(false);
      }
    };
    loadXlsx();
  }, []);

  const downloadCSV = () => {
    // Gera CSV a partir do preview atual
    const delimiter = ";";
    const escapeCell = (v: any) => String(v ?? "").replace(/"/g, '""');
    const headerLine = headers.map((h) => `"${escapeCell(h)}"`).join(delimiter);
    const dataLines = rows.map((r) => r.cells.map((c) => `"${escapeCell(c)}"`).join(delimiter));
    const csv = [headerLine, ...dataLines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planilha_teste_preview.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visualizar Planilha de Teste</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arquivo: /public/planilha_teste.xlsx {sheetName && `(aba: ${sheetName})`}
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">Carregando planilha...</p>
          </div>
        )}

        {error && (
          <div className="border border-destructive rounded-md p-4 text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Preview das primeiras 50 linhas</p>
              <Button size="sm" onClick={downloadCSV} className="gap-2">Exportar preview CSV</Button>
            </div>

            <div className="border rounded-lg bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, idx) => (
                      <TableHead key={idx} className="text-xs whitespace-nowrap">{h || `Coluna ${idx+1}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((_, j) => (
                        <TableCell key={j} className="text-xs whitespace-nowrap">{r.cells?.[j] ?? ""}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}