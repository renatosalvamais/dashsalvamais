import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
}

interface PlanStore {
  products: Product[];
  setProducts: (products: Product[]) => void;
  updateProduct: (id: string, price: number) => void;
  getProductPrice: (name: string) => number;
}

const initialProducts: Product[] = [
  { id: "1", name: "Plano Básico", price: 39.90 },
  { id: "2", name: "Plano Básico Familiar", price: 69.90 },
  { id: "3", name: "Plano Intermediário", price: 49.90 },
  { id: "4", name: "Plano Intermediário Familiar", price: 79.90 },
  { id: "5", name: "Plano Avançado", price: 59.90 },
  { id: "6", name: "Plano Avançado Familiar", price: 89.90 },
  { id: "7", name: "ePharma (50)", price: 0.00 },
  { id: "8", name: "ePharma (100)", price: 9.90 },
  { id: "9", name: "ePharma (150)", price: 14.90 },
  { id: "10", name: "TotalPass1", price: 19.90 },
  { id: "11", name: "TotalPass2", price: 14.90 },
  { id: "12", name: "TotalPass3", price: 12.90 },
  { id: "13", name: "Ubook", price: 1.00 },
  { id: "14", name: "Braslivros", price: 1.00 },
];

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      setProducts: (products) => set({ products }),
      updateProduct: (id, price) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, price } : p
          ),
        })),
      getProductPrice: (name) => {
        const product = get().products.find((p) => p.name === name);
        return product ? product.price : 0;
      },
    }),
    {
      name: 'plan-storage',
    }
  )
);
