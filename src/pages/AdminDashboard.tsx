import { AdminLayout } from "@/components/AdminLayout";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo ao painel administrativo
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Visão Geral</h2>
          <p className="text-muted-foreground">
            Conteúdo do dashboard administrativo será exibido aqui.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
