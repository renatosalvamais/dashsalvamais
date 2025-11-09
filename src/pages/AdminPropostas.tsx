import { AdminLayout } from "@/components/AdminLayout";

const AdminPropostas = () => {
  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground">Propostas</h1>
          <p className="text-muted-foreground mt-2">
            Gerenciamento de propostas
          </p>
        </div>

        <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
          <iframe
            src="https://propostasalvamais.lovable.app/gerador"
            className="w-full h-full"
            title="Propostas Salva+"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPropostas;
