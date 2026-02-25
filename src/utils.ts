import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return `+${cleaned.slice(0, 2)}****${cleaned.slice(-3)}`;
}

export function normalizeAlias(alias: string): string {
  return alias.trim().toLowerCase().replace(/[:.!?]$/, '');
}
