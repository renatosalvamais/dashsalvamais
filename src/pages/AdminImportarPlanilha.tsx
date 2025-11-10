import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";

interface ImportLog {
  id: number;
  empresa: string;
  data: string;
  status: "sucesso" | "falha";
}

const AdminImportarPlanilha = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([
    {
      id: 1,
      empresa: "Empresa Exemplo LTDA",
      data: "2025-11-08 14:30:00",
      status: "sucesso",
    },
    {
      id: 2,
      empresa: "Outra Empresa SA",
      data: "2025-11-07 10:15:00",
      status: "falha",
    },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo");
      return;
    }

    const novoLog: ImportLog = {
      id: importLogs.length + 1,
      empresa: "Nova Empresa",
      data: new Date().toLocaleString("pt-BR"),
      status: Math.random() > 0.3 ? "sucesso" : "falha",
    };

    setImportLogs([novoLog, ...importLogs]);
    
    if (novoLog.status === "sucesso") {
      toast.success("Planilha importada com sucesso!");
    } else {
      toast.error("Falha ao importar planilha");
    }
    
    setSelectedFile(null);
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Importar Planilha
          </h1>
          <p className="text-sm text-muted-foreground">
            Importe colaboradores através de planilhas Excel
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Upload de Planilha
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="file-upload" className="text-sm">
                  Selecione o arquivo
                </Label>
                <a
                  href="/templates/beneficiary_template.xlsx"
                  download
                  className="text-xs text-primary hover:underline flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Baixar modelo de planilha
                </a>
              </div>
              
              <div className="flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>

              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: <span className="font-semibold">{selectedFile.name}</span>
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                variant="search"
                size="lg"
                className="px-12 gap-2"
              >
                <Upload className="h-4 w-4" />
                ENVIAR
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Log de Importações
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-xs font-semibold">Empresa</th>
                  <th className="text-left p-2 text-xs font-semibold">Data de Envio</th>
                  <th className="text-left p-2 text-xs font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {importLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border">
                    <td className="p-2 text-xs">{log.empresa}</td>
                    <td className="p-2 text-xs">{log.data}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          log.status === "sucesso"
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {log.status === "sucesso" ? "Sucesso" : "Falha"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminImportarPlanilha;
