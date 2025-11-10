import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileDown } from "lucide-react";
import { toast } from "sonner";

interface Colaborador {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

interface Empresa {
  cnpj: string;
  nome: string;
}

const empresasData: Empresa[] = [
  { cnpj: "34.225.216/0001-77", nome: "Salva+ Benefícios" },
  { cnpj: "12.345.678/0001-90", nome: "Tech Solutions LTDA" },
  { cnpj: "98.765.432/0001-10", nome: "Inovação Empresarial S.A." },
];

const AdminCadastroManual = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(
    Array(5).fill(null).map(() => ({ nome: "", cpf: "", telefone: "", email: "" }))
  );

  const filteredEmpresas = empresasData.filter((empresa) =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.cnpj.includes(searchTerm)
  );

  const adicionarLinhas = () => {
    const novasLinhas = Array(5).fill(null).map(() => ({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
    }));
    setColaboradores([...colaboradores, ...novasLinhas]);
  };

  const limparLinhas = () => {
    setColaboradores(
      Array(5).fill(null).map(() => ({ nome: "", cpf: "", telefone: "", email: "" }))
    );
  };

  const handleExport = () => {
    if (!selectedEmpresa) {
      toast.error("Selecione uma empresa primeiro!");
      return;
    }
    toast.success("Planilha XLS exportada com sucesso!");
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
                Total de linhas disponíveis: <span className="font-semibold">{colaboradores.length}</span>
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
                  {colaboradores.map((_, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="p-2 text-xs">{index + 1}</td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome completo"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="(11) 99999-9999"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome dep. 1"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome dep. 2"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="Nome dep. 3"
                          className="bg-muted/50 h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="000.000.000-00"
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

            <div className="flex justify-center">
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
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCadastroManual;
