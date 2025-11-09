import { AdminLayout } from "@/components/AdminLayout";

const AdminGerador = () => {
  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground">Gerador Salva+</h1>
          <p className="text-muted-foreground mt-2">
            Ferramenta de geração de benefícios
          </p>
        </div>

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
