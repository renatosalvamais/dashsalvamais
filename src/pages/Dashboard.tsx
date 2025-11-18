import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { ActionCard } from "@/components/ActionCard";
import { UserPlus, UserMinus, List, Users } from "lucide-react";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { formatCNPJ } from "@/lib/utils";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";
import { useEffect } from "react";

const Dashboard = () => {
  const { data: companyCtx } = useCurrentCompany();
  const companyId = companyCtx?.company?.id;
  const { data: beneficiaries = [] } = useBeneficiaries(companyId);

  // Deriva contagens dos beneficiários quando disponíveis
  const derivedTotal = beneficiaries.length;
  const derivedIndividual = beneficiaries.filter((b) => (b.dependentes ?? 0) === 0).length;
  const derivedFamiliar = beneficiaries.filter((b) => (b.dependentes ?? 0) > 0).length;

  // Fallback para campos agregados da empresa quando a lista não está disponível (RLS/sem dados)
  const total = derivedTotal || (companyCtx?.company?.total_vidas ?? 0);
  const individual = derivedIndividual || (companyCtx?.company?.total_individual ?? 0);
  const familiar = derivedFamiliar || (companyCtx?.company?.total_familiar ?? 0);

  // Assistência PET removida conforme solicitado
  const pet = 0;

  useEffect(() => {
    console.log("Dashboard: companyCtx", companyCtx);
    console.log("Dashboard: companyId", companyId);
    console.log("Dashboard: beneficiaries length", beneficiaries.length);
    console.log("Dashboard: sample beneficiaries", beneficiaries.slice(0, 3));
    console.log("Dashboard: counts", {
      derivedTotal,
      derivedIndividual,
      derivedFamiliar,
      total,
      individual,
      familiar,
    });
  }, [companyCtx, companyId, beneficiaries]);

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
          <p className="text-secondary-foreground font-medium">{companyCtx?.company?.nome ?? "-"}</p>
          <p className="text-secondary-foreground/70 text-sm">
            CNPJ: {companyCtx?.cnpj ? formatCNPJ(companyCtx.cnpj) : "-"}
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard value={total} label="Total Colaboradores" color="total" />
            <StatCard value={individual} label="Planos Individuais" color="active" />
            <StatCard value={familiar} label="Planos Familiares" color="family" />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
