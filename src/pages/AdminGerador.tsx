import { AdminLayout } from "@/components/AdminLayout";

const AdminGerador = () => {
  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 bg-card rounded-lg border border-border overflow-hidden">
          <iframe
            src="https://preview--geradorsalvamais.lovable.app/gerador-salva"
            className="w-full h-full"
            title="Gerador Salva+"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGerador;
