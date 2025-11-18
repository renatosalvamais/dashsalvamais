import { usePlanStore } from "./planStore";

export type PlanoTipo = "individual" | "familiar";

export interface PlanoInfo {
  tipo: PlanoTipo;
  nome: string;
  preco: number;
}

/**
 * Determina o tipo de plano baseado no número de dependentes
 * @param dependentes - Número de dependentes (0 = individual, >0 = familiar)
 * @param produtoNome - Nome do produto (TotalPass, Epharma, etc.)
 * @returns Informações do plano dinâmico
 */
export function determinarPlanoDinamico(dependentes: number, produtoNome: string): PlanoInfo {
  const planoStore = usePlanStore.getState();
  
  // Se não houver dependentes, é plano individual
  if (dependentes === 0) {
    const produtoIndividual = planoStore.products.find(p => 
      p.name.toLowerCase().includes(produtoNome.toLowerCase()) && 
      !p.name.toLowerCase().includes("familiar")
    );
    
    return {
      tipo: "individual",
      nome: produtoIndividual?.name || `${produtoNome} Individual`,
      preco: produtoIndividual?.price || 0
    };
  }
  
  // Se houver dependentes, é plano familiar
  const produtoFamiliar = planoStore.products.find(p => 
    p.name.toLowerCase().includes(produtoNome.toLowerCase()) && 
    p.name.toLowerCase().includes("familiar")
  );
  
  return {
    tipo: "familiar",
    nome: produtoFamiliar?.name || `${produtoNome} Familiar`,
    preco: produtoFamiliar?.price || 0
  };
}

/**
 * Função para determinar o plano TotalPass dinamicamente
 */
export function determinarTotalPass(dependentes: number): PlanoInfo {
  return determinarPlanoDinamico(dependentes, "TotalPass");
}

/**
 * Função para determinar o plano Epharma dinamicamente
 */
export function determinarEpharma(dependentes: number): PlanoInfo {
  return determinarPlanoDinamico(dependentes, "Epharma");
}