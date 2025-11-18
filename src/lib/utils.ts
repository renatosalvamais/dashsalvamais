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

export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return numbers.replace(/^(\d{3})(\d+)/, '$1.$2');
  if (numbers.length <= 9) return numbers.replace(/^(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
}

export function formatPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return numbers.replace(/^(\d{2})(\d+)/, '($1) $2');
  if (numbers.length <= 10) return numbers.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
  return numbers.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
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
