import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ImportarPlanilha = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    // Simular envio - removido log de importação
    toast.success("Planilha importada com sucesso!");
    
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Importar Planilha
            </h1>
            <p className="text-muted-foreground">
              Empresa: Salva+ Benefícios - CNPJ: 34.225.216/0001-77
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-xl font-bold text-card-foreground mb-6">
            Upload de Planilha
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="file-upload" className="text-base">
                  Selecione o arquivo
                </Label>
                <a
                  href="/templates/beneficiary_template.xlsx"
                  download
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
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
                <p className="text-sm text-muted-foreground">
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
      </div>
    </Layout>
  );
};

export default ImportarPlanilha;