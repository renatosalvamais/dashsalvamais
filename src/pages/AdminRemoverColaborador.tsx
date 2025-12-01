import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useBeneficiaries, useDeleteBeneficiary } from "@/hooks/useBeneficiaries";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const AdminRemoverColaborador = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: beneficiaries = [], isLoading } = useBeneficiaries();
  const deleteBeneficiary = useDeleteBeneficiary();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{titular: any, dependentes: any[]}>({titular: null, dependentes: []});

  const digitsOnly = (v: string) => v.replace(/\D/g, "");

  // Agrupar titulares com seus dependentes
  const groupedBeneficiaries = () => {
    const titulares = beneficiaries.filter(b => b.status === "titular" && !b.deleted_at);
    return titulares.map(titular => {
      const dependentes = beneficiaries.filter(b => 
        b.status === "dependente" && 
        b.company_id === titular.company_id &&
        !b.deleted_at &&
        // Aproximação: assumir que dependentes do mesmo titular estão próximos temporalmente
        Math.abs(new Date(b.created_at || "").getTime() - new Date(titular.created_at || "").getTime()) < 60000
      );
      return { titular, dependentes };
    });
  };

  const filteredGroups = groupedBeneficiaries().filter(group =>
    group.titular.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    digitsOnly(group.titular.cpf).includes(digitsOnly(searchTerm))
  );

  const handleDeleteGroup = async () => {
    try {
      // Deletar titular
      await deleteBeneficiary.mutateAsync(selectedGroup.titular.id);
      
      // Deletar todos os dependentes
      for (const dep of selectedGroup.dependentes) {
        await deleteBeneficiary.mutateAsync(dep.id);
      }
      
      toast.success(`${selectedGroup.titular.nome} e ${selectedGroup.dependentes.length} dependente(s) foram removidos.`);
      setShowDeleteDialog(false);
      setSelectedGroup({titular: null, dependentes: []});
    } catch (e: any) {
      toast.error("Erro ao remover: " + (e?.message || String(e)));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Remover Colaborador
          </h1>
          <p className="text-sm text-muted-foreground">
            Busque e remova colaboradores (titular + dependentes) do sistema
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
            Buscar por nome ou CPF do titular
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

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Titular */}
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4 text-primary" />
                          <div>
                            <div className="font-semibold text-sm text-foreground">
                              {group.titular.nome} <span className="text-xs text-muted-foreground">(Titular)</span>
                            </div>
                            <div className="text-xs text-muted-foreground">CPF: {group.titular.cpf}</div>
                          </div>
                        </div>

                        {/* Dependentes */}
                        {group.dependentes.length > 0 && (
                          <div className="ml-6 space-y-1 pt-2 border-t border-border/50">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Dependentes ({group.dependentes.length}):
                            </div>
                            {group.dependentes.map((dep, depIdx) => (
                              <div key={depIdx} className="text-xs text-muted-foreground ml-2">
                                • {dep.nome} - CPF: {dep.cpf}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2 ml-4"
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Excluir Grupo
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  Nenhum colaborador encontrado.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover <strong>{selectedGroup.titular?.nome}</strong> e 
              <strong> {selectedGroup.dependentes.length} dependente(s)</strong> do sistema.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminRemoverColaborador;
