/**
 * @file case-transformer.ts
 * @description Utilidades de transformación de casing para el cliente HTTP.
 *
 * El backend responde SIEMPRE en snake_case.
 * El frontend usa SIEMPRE camelCase.
 *
 * Esta capa de transformación es la ÚNICA responsable de esa conversión,
 * manteniendo el resto del código libre de lógica de mapeo.
 */

// ---------------------------------------------------------------------------
// Tipos auxiliares de TypeScript para el mapeo profundo
// ---------------------------------------------------------------------------

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S;

export type DeepCamelCase<T> = T extends (infer U)[]
  ? DeepCamelCase<U>[]
  : T extends object
    ? {
        [K in keyof T as CamelCase<K & string>]: DeepCamelCase<T[K]>;
      }
    : T;

// ---------------------------------------------------------------------------
// Conversión de clave individual
// ---------------------------------------------------------------------------

/**
 * Convierte una clave en snake_case a camelCase.
 * @example snakeToCamel('scheduled_departure') => 'scheduledDeparture'
 */
export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Convierte una clave en camelCase a snake_case.
 * @example camelToSnake('scheduledDeparture') => 'scheduled_departure'
 */
export function camelToSnake(key: string): string {
  return key.replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`);
}

// ---------------------------------------------------------------------------
// Transformaciones profundas (Deep transform)
// ---------------------------------------------------------------------------

/**
 * Transforma recursivamente un objeto de snake_case a camelCase.
 * Maneja objetos anidados, arrays y valores primitivos.
 *
 * @param data - Objeto crudo proveniente del backend (snake_case)
 * @returns El mismo objeto con todas las claves en camelCase
 *
 * @example
 * const raw = { scheduled_departure: '2025-01-01', vehicle: { plate_number: 'ABC-123' } };
 * deepToCamel(raw);
 * // => { scheduledDeparture: '2025-01-01', vehicle: { plateNumber: 'ABC-123' } }
 */
export function deepToCamel<T>(data: T): DeepCamelCase<T> {
  if (Array.isArray(data)) {
    return data.map((item) => deepToCamel(item)) as DeepCamelCase<T>;
  }

  if (data !== null && typeof data === "object" && !(data instanceof Date)) {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        snakeToCamel(key),
        deepToCamel(value),
      ]),
    ) as DeepCamelCase<T>;
  }

  return data as DeepCamelCase<T>;
}

/**
 * Transforma recursivamente un objeto de camelCase a snake_case.
 * Usado para serializar el body de las peticiones al backend.
 *
 * @param data - Objeto del frontend (camelCase)
 * @returns El mismo objeto con todas las claves en snake_case
 *
 * @example
 * const payload = { scheduledDeparture: '2025-01-01' };
 * deepToSnake(payload);
 * // => { scheduled_departure: '2025-01-01' }
 */
export function deepToSnake<T>(data: T): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => deepToSnake(item));
  }

  if (data !== null && typeof data === "object" && !(data instanceof Date)) {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        camelToSnake(key),
        deepToSnake(value),
      ]),
    );
  }

  return data;
}
