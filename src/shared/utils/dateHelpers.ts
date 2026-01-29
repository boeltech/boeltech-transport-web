/**
 * Date/Time Helpers para formularios
 *
 * Maneja correctamente la conversión entre:
 * - Input datetime-local (hora local del usuario)
 * - ISO 8601 con timezone (para el backend)
 *
 * Ubicación sugerida: src/shared/utils/dateHelpers.ts
 */

// ============================================================================
// DATETIME-LOCAL → ISO 8601 (para enviar al backend)
// ============================================================================

/**
 * Convierte un valor de input datetime-local a ISO 8601 con timezone
 *
 * El input datetime-local devuelve la hora en zona local del usuario
 * sin indicador de timezone (ej: "2026-01-30T08:00")
 *
 * Esta función lo convierte a ISO 8601 completo con la zona horaria correcta
 *
 * @param dateTimeLocal - Valor del input datetime-local (ej: "2026-01-30T08:00")
 * @returns ISO 8601 string (ej: "2026-01-30T14:00:00.000Z" si el usuario está en UTC-6)
 */
export function localDateTimeToISO(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";

  // El input datetime-local no incluye timezone,
  // pero representa la hora LOCAL del usuario
  // new Date() lo interpreta como hora local automáticamente
  const localDate = new Date(dateTimeLocal);

  // toISOString() convierte a UTC automáticamente
  return localDate.toISOString();
}

/**
 * Versión que preserva la hora local como si fuera UTC
 * Usar solo si el backend espera la hora "tal cual" sin conversión
 *
 * @param dateTimeLocal - Valor del input datetime-local
 * @returns ISO 8601 string con la misma hora pero marcada como UTC
 */
export function localDateTimeToUTCString(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";

  // Agregar segundos y Z directamente (sin conversión de timezone)
  if (dateTimeLocal.length === 16) {
    return `${dateTimeLocal}:00.000Z`;
  }
  if (!dateTimeLocal.endsWith("Z")) {
    return `${dateTimeLocal}.000Z`;
  }
  return dateTimeLocal;
}

// ============================================================================
// ISO 8601 → DATETIME-LOCAL (para mostrar en formulario)
// ============================================================================

/**
 * Convierte una fecha ISO 8601 o Date al formato de input datetime-local
 * Muestra la hora en la zona horaria LOCAL del usuario
 *
 * @param date - Fecha ISO string o Date object
 * @returns String para input datetime-local (ej: "2026-01-30T08:00")
 */
export function isoToLocalDateTime(
  date: Date | string | undefined | null,
): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "";

  // Obtener componentes en hora LOCAL
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convierte una fecha ISO 8601 preservando la hora exacta (ignorando timezone)
 * Usar cuando la fecha del backend debe mostrarse "tal cual"
 *
 * @param isoString - Fecha ISO string
 * @returns String para input datetime-local
 */
export function isoToLocalDateTimePreserve(
  isoString: string | undefined | null,
): string {
  if (!isoString) return "";

  // Tomar solo los primeros 16 caracteres (YYYY-MM-DDTHH:mm)
  return isoString.slice(0, 16);
}

// ============================================================================
// HELPERS ADICIONALES
// ============================================================================

/**
 * Obtiene la fecha actual en formato datetime-local
 */
export function getCurrentLocalDateTime(): string {
  return isoToLocalDateTime(new Date());
}

/**
 * Obtiene la fecha actual + N horas en formato datetime-local
 */
export function getLocalDateTimePlusHours(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return isoToLocalDateTime(date);
}

/**
 * Valida si una fecha es futura
 */
export function isFutureDate(dateTimeLocal: string): boolean {
  if (!dateTimeLocal) return false;
  return new Date(dateTimeLocal) > new Date();
}

/**
 * Valida si fecha A es anterior a fecha B
 */
export function isDateBefore(dateA: string, dateB: string): boolean {
  if (!dateA || !dateB) return false;
  return new Date(dateA) < new Date(dateB);
}
