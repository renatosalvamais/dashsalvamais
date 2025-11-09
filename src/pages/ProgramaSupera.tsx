import { Layout } from "@/components/Layout";

const ProgramaSupera = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Programa Supera
          </h1>
          <p className="text-muted-foreground">
            Configurações e gerenciamento do programa
          </p>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border">
          <p className="text-card-foreground">
            Funcionalidade em desenvolvimento...
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ProgramaSupera;
