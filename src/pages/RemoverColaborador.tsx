import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const RemoverColaborador = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Remover Colaborador
          </h1>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Search className="h-6 w-6 text-foreground" />
            <h2 className="text-2xl font-bold text-card-foreground">
              Buscar Colaborador
            </h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Buscar por nome, CPF ou e-mail
          </p>

          <div className="flex gap-3">
            <Input
              placeholder="Digite pelo menos 2 caracteres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button className="gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RemoverColaborador;
