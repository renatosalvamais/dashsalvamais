import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Beneficiary = Tables<"beneficiaries">;
export type BeneficiaryInsert = TablesInsert<"beneficiaries">;
export type BeneficiaryUpdate = TablesUpdate<"beneficiaries">;

export const useBeneficiaries = (companyId?: string) => {
  return useQuery({
    queryKey: companyId ? ["beneficiaries", companyId] : ["beneficiaries"],
    queryFn: async () => {
      console.log("useBeneficiaries: iniciando consulta", { companyId });
      let query = supabase
        .from("beneficiaries")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      
      if (companyId) {
        query = query.eq("company_id", companyId);
      }
      
      try {
        const { data, error } = await query;
        if (error) {
          console.error("useBeneficiaries: erro na consulta", error);
          throw error;
        }
        console.log("useBeneficiaries: registros retornados", data ? data.length : 0);
        return data as Beneficiary[];
      } catch (e) {
        console.error("useBeneficiaries: exceção", e);
        throw e;
      }
    },
  });
};

export const useCreateBeneficiary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (beneficiary: BeneficiaryInsert) => {
      const { data, error } = await supabase
        .from("beneficiaries")
        .insert(beneficiary)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Colaborador cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar colaborador: " + error.message);
    },
  });
};

export const useUpdateBeneficiary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: BeneficiaryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("beneficiaries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Colaborador atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar colaborador: " + error.message);
    },
  });
};

export const useDeleteBeneficiary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas atualiza deleted_at
      const { error } = await supabase
        .from("beneficiaries")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Colaborador removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover colaborador: " + error.message);
    },
  });
};
