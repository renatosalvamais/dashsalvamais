import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatCNPJ } from "@/lib/utils";

export type CurrentCompanyContext = {
  cnpj: string;
  company: Tables<"companies"> | null;
};

export const useCurrentCompany = () => {
  return useQuery<CurrentCompanyContext | null>({
    queryKey: ["current-company"],
    queryFn: async () => {
      console.log("useCurrentCompany: iniciando consulta de sessão");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = sessionData?.session?.user?.id;
      console.log("useCurrentCompany: userId", userId);
      if (!userId) return null;

      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("cnpj, role")
        .eq("user_id", userId)
        .maybeSingle();
      if (roleError) throw roleError;
      console.log("useCurrentCompany: roleRow", roleRow);
      const cnpjDigits = String(roleRow?.cnpj || "").replace(/\D/g, "");
      console.log("useCurrentCompany: cnpjDigits", cnpjDigits);
      if (!cnpjDigits) return null;

      const formattedCnpj = formatCNPJ(cnpjDigits);
      console.log("useCurrentCompany: formattedCnpj", formattedCnpj);

      // Tenta por CNPJ dígitos (ex.: 34225216000177)
      const { data: companyDigits, error: compErrDigits } = await supabase
        .from("companies")
        .select("*")
        .eq("cnpj", cnpjDigits)
        .maybeSingle();
      if (compErrDigits) throw compErrDigits;
      console.log("useCurrentCompany: try digits", { cnpjDigits, companyDigits });

      let companyTry = companyDigits;

      // Se não achou, tenta pelo CNPJ formatado (ex.: 34.225.216/0001-77)
      if (!companyTry) {
        const { data: companyFormatted, error: compErrFmt } = await supabase
          .from("companies")
          .select("*")
          .eq("cnpj", formattedCnpj)
          .maybeSingle();
        if (compErrFmt) throw compErrFmt;
        console.log("useCurrentCompany: try formatted", { formattedCnpj, companyFormatted });
        companyTry = companyFormatted ?? null;
      }

      // Se ainda não achou, tenta padrões parciais com ilike
      if (!companyTry) {
        const { data: companyIlike, error: compErrIlike } = await supabase
          .from("companies")
          .select("*")
          .or([
            `cnpj.ilike.%${cnpjDigits}%`,
            `cnpj.ilike.%${formattedCnpj}%`,
          ].join(","))
          .limit(1)
          .maybeSingle();
        if (compErrIlike) throw compErrIlike;
        console.log("useCurrentCompany: try ilike", { cnpjDigits, formattedCnpj, companyIlike });
        companyTry = companyIlike ?? null;
      }

      console.log("useCurrentCompany: company", companyTry);

      return { cnpj: cnpjDigits, company: companyTry ?? null };
    },
  });
};