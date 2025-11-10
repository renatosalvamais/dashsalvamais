import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Colaborador {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

const AdminCadastroManual = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(
    Array(5).fill(null).map(() => ({ nome: "", cpf: "", telefone: "", email: "" }))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Colaboradores cadastrados com sucesso!");
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

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Lista de Colaboradores
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                type="submit"
                variant="search"
                size="lg"
                className="px-12"
              >
                ENVIAR
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCadastroManual;
