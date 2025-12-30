// src/shared/lib/utils.js

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn - Utility function para combinar clases de Tailwind
 * 
 * Combina clsx (para concatenar clases condicionalmente) con
 * twMerge (para resolver conflictos de clases de Tailwind)
 * 
 * @param {...any} inputs - Clases a combinar
 * @returns {string} - String de clases combinadas
 * 
 * @example
 * cn("text-red-500", "bg-blue-500")
 * // "text-red-500 bg-blue-500"
 * 
 * @example
 * cn("text-red-500", someCondition && "bg-blue-500")
 * // "text-red-500 bg-blue-500" (si someCondition es true)
 * // "text-red-500" (si someCondition es false)
 * 
 * @example
 * // Resuelve conflictos (último gana)
 * cn("p-4", "p-2")
 * // "p-2"
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}