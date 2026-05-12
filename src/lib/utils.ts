import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyBRL(value: number | string): string {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(amount)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function maskCurrencyBRL(value: string): string {
  // Remove non-digits
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  
  const amount = parseInt(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function parseCurrencyBRL(value: string): number {
  return parseInt(value.replace(/\D/g, '')) / 100 || 0;
}
