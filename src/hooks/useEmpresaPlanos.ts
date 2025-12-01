import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmpresaPlano {
  id: string;
  empresa_id: string;
  produto_id: string;
  created_at: string;
}

export const useEmpresaPlanos = (empresaId?: string) => {
  return useQuery({
    queryKey: ["empresa_planos", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from("empresa_planos")
        .select("*")
        .eq("empresa_id", empresaId);
      
      if (error) throw error;
      return data as EmpresaPlano[];
    },
    enabled: !!empresaId,
  });
};

export const useUpdateEmpresaPlanos = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ empresaId, produtoIds }: { empresaId: string; produtoIds: string[] }) => {
      // Remove todos os planos existentes da empresa
      const { error: deleteError } = await supabase
        .from("empresa_planos")
        .delete()
        .eq("empresa_id", empresaId);
      
      if (deleteError) throw deleteError;
      
      // Insere os novos planos selecionados
      if (produtoIds.length > 0) {
        const inserts = produtoIds.map(produtoId => ({
          empresa_id: empresaId,
          produto_id: produtoId,
        }));
        
        const { error: insertError } = await supabase
          .from("empresa_planos")
          .insert(inserts);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["empresa_planos", variables.empresaId] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Planos da empresa atualizados!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar planos: " + error.message);
    },
  });
};
