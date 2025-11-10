import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const colaboradoresData = [
  {
    nome: "JOAO DE SOUZA DA SILVA",
    cpf: "607.773.270-23",
  },
  {
    nome: "Joao Paulo Souza Dev",
    cpf: "534.753.070-73",
  },
  {
    nome: "LUIZ DOURADO DIAS JUNIOR",
    cpf: "791.185.680-09",
  },
];

const AdminRemoverColaborador = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = (nome: string) => {
    toast.success(`${nome} foi removido com sucesso.`);
  };

  const filteredColaboradores = colaboradoresData.filter((colab) =>
    colab.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colab.cpf.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Remover Colaborador
          </h1>
          <p className="text-sm text-muted-foreground">
            Busque e remova colaboradores do sistema
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-bold text-card-foreground">
              Buscar Colaborador
            </h2>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Buscar por nome, CPF ou e-mail
          </p>

          <div className="flex gap-3">
            <Input
              placeholder="Digite pelo menos 2 caracteres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="search" className="gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-bold text-card-foreground mb-4">
            Lista de Colaboradores
          </h2>

          <div className="space-y-3">
            {filteredColaboradores.map((colab, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">{colab.nome}</div>
                  <div className="text-xs text-muted-foreground">CPF: {colab.cpf}</div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleDelete(colab.nome)}
                >
                  <Trash2 className="h-3 w-3" />
                  Excluir
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRemoverColaborador;
