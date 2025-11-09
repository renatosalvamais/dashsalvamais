import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { ActionCard } from "@/components/ActionCard";
import { UserPlus, UserMinus, List, Users } from "lucide-react";

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard RH
          </h1>
        </div>

        {/* Welcome Card */}
        <div className="bg-secondary rounded-xl p-6 border border-border">
          <h2 className="text-2xl font-bold text-secondary-foreground mb-2">
            Bem-vindo!
          </h2>
          <p className="text-secondary-foreground font-medium">teste</p>
          <p className="text-secondary-foreground/70 text-sm">
            CNPJ: 51.028.224/0001-41
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="Cadastrar Colaborador"
            description="Adicione novos colaboradores ao sistema"
            icon={UserPlus}
            to="/cadastrar"
            variant="success"
          />
          <ActionCard
            title="Remover Colaborador"
            description="Remova colaboradores do sistema"
            icon={UserMinus}
            to="/remover"
            variant="destructive"
          />
          <ActionCard
            title="Lista Completa"
            description="Visualize todos os colaboradores cadastrados"
            icon={List}
            to="/lista"
            variant="primary"
          />
        </div>

        {/* Stats Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Resumo Rápido
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              value={28}
              label="Total Colaboradores"
              color="total"
            />
            <StatCard
              value={18}
              label="Planos Individuais"
              color="active"
            />
            <StatCard
              value={10}
              label="Planos Familiares"
              color="family"
            />
            <StatCard
              value={2}
              label="Com Assistência PET"
              color="removed"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
