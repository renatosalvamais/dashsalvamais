import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCNPJ(cnpj: string): string {
  // Remove tudo que não é número
  const numbers = cnpj.replace(/\D/g, '');
  
  // Aplica a máscara XX.XXX.XXX/XXXX-XX
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function normalizeCompanyName(name: string): string {
  // Converter para maiúsculas
  let normalized = name.toUpperCase();
  
  // Remover acentos
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Remover caracteres especiais (mantém apenas letras, números e espaços)
  normalized = normalized.replace(/[^A-Z0-9\s]/g, '');
  
  return normalized;
}
