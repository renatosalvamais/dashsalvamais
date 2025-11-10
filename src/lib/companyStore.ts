import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Company {
  id: string;
  cnpj: string;
  nome: string;
  endereco: string;
  contato: string;
  email: string;
  telefone: string;
  cidade: string;
  totalVidas: number;
  totalIndividual: number;
  totalFamiliar: number;
  plano: string;
  desconto: number;
  valor: number;
  beneficios: {
    clubeDescontos: boolean;
    clubeDescontosDependente: boolean;
    telemedicina: boolean;
    telemedicinaFamiliar: boolean;
    unimais: boolean;
    ubook: boolean;
    totalpass: string;
    epharma: string;
    epharmaDependente: string;
  };
}

interface CompanyStore {
  companies: Company[];
  addCompany: (company: Company) => void;
  removeCompany: (id: string) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      companies: [],
      addCompany: (company) =>
        set((state) => ({
          companies: [...state.companies, company],
        })),
      removeCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
        })),
      updateCompany: (id, updatedCompany) =>
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...updatedCompany } : c
          ),
        })),
    }),
    {
      name: 'company-storage',
    }
  )
);
