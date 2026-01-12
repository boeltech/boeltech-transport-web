import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma inteligente
 *
 * - Usa clsx para combinar clases condicionales
 * - Usa tailwind-merge para resolver conflictos
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * // Si className = 'px-8', el resultado será 'py-2 bg-primary px-8'
 * // (px-4 se reemplaza por px-8)
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};
