import { AdminLayout } from "@/components/AdminLayout";

const AdminPropostas = () => {
  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
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
