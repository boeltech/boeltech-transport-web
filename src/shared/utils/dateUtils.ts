/**
 * Utilidades de fecha para Boeltech ERP — Frontend.
 *
 * Regla: las fechas viajan por la red como strings.
 * Solo se convierten a Date de JS en el último momento: el display.
 */

const MEXICO_TIMEZONE = "America/Mexico_City";

// ──────────────────────────────────────────────
// DISPLAY (conversión a string legible)
// ──────────────────────────────────────────────

/**
 * Formatea un string "YYYY-MM-DD" para mostrar al usuario.
 * Ejemplo: "2025-03-10" → "10 mar 2025"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  // Construir a mediodía UTC para evitar drift
  const d = new Date(dateString + "T12:00:00Z");
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: MEXICO_TIMEZONE,
  });
}

/**
 * Formatea un ISO timestamp UTC para mostrar al usuario en hora México.
 * Ejemplo: "2025-03-10T18:00:00.000Z" → "10 mar 2025, 12:00 p.m."
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MEXICO_TIMEZONE,
  });
}

/**
 * Formatea solo la hora de un ISO timestamp en hora México.
 * Ejemplo: "2025-03-10T18:00:00.000Z" → "12:00 p.m."
 */
export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MEXICO_TIMEZONE,
  });
}

// ──────────────────────────────────────────────
// CONSTRUCCIÓN para formularios → API
// ──────────────────────────────────────────────

/**
 * Convierte el valor de un <input type="datetime-local"> al ISO UTC string
 * que espera el backend.
 *
 * El input devuelve "2025-03-10T12:00" (hora local sin timezone).
 * Esta función asume que el usuario está en México y construye el UTC correcto.
 */
export function localInputToUtcIso(localDateTimeInput: string): string {
  if (!localDateTimeInput) return "";
  // Appendamos el offset de México. Para producción considera usar
  // Intl.DateTimeFormat para detectar el offset actual (respeta DST).
  const mexicoOffset = getMexicoOffsetMs();
  const localMs = new Date(localDateTimeInput).getTime();
  // Restamos el offset para obtener UTC
  return new Date(localMs - mexicoOffset).toISOString();
}

/**
 * Convierte un ISO UTC string al formato que espera un <input type="datetime-local">.
 * Ejemplo: "2025-03-10T18:00:00.000Z" → "2025-03-10T12:00"
 */
export function utcIsoToLocalInput(
  isoString: string | null | undefined,
): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const mexicoOffset = getMexicoOffsetMs();
  const localMs = d.getTime() + mexicoOffset;
  const local = new Date(localMs);
  // Formato YYYY-MM-DDTHH:mm
  return local.toISOString().substring(0, 16);
}

/**
 * Retorna el offset en ms de Mexico/Ciudad de México respecto a UTC,
 * teniendo en cuenta el Horario de Verano (DST).
 */
function getMexicoOffsetMs(): number {
  const now = new Date();
  const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  const mxStr = now.toLocaleString("en-US", { timeZone: MEXICO_TIMEZONE });
  return new Date(mxStr).getTime() - new Date(utcStr).getTime();
}

// ──────────────────────────────────────────────
// UTILIDADES de comparación (Tipo A)
// ──────────────────────────────────────────────

export function isExpired(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const today = getTodayString();
  return dateString < today;
}

export function isExpiringSoon(
  dateString: string | null | undefined,
  withinDays = 30,
): boolean {
  if (!dateString) return false;
  const today = getTodayString();
  const future = addDays(today, withinDays);
  return dateString >= today && dateString <= future;
}

export function getTodayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TIMEZONE,
  }).format(new Date());
}

function addDays(dateString: string, days: number): string {
  const d = new Date(dateString + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

/**
 * Calcula la fecha de vencimiento sumando N días a una fecha "YYYY-MM-DD".
 * Retorna el string de vencimiento en formato "YYYY-MM-DD".
 */
export function getExpiryDateString(
  date: string | Date,
  validityDays: number,
): string {
  const dateString =
    date instanceof Date
      ? date.toISOString().substring(0, 10) // extrae "YYYY-MM-DD" en UTC
      : date;

  const d = new Date(dateString + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + validityDays);
  return d.toISOString().substring(0, 10);
}

/**
 * Calcula los días restantes desde hoy hasta una fecha "YYYY-MM-DD".
 * Retorna número negativo si ya venció, 0 si vence hoy, null si no hay fecha.
 */
export function getDaysUntilDateString(
  dateString: string | null | undefined,
): number | null {
  if (!dateString) return null;
  const today = getTodayString();
  const todayMs = new Date(today + "T12:00:00Z").getTime();
  const targetMs = new Date(dateString + "T12:00:00Z").getTime();
  return Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));
}

// ──────────────────────────────────────────────
// VERSIONADO: Para catálogos y otros recursos
// ──────────────────────────────────────────────

/**
 * Devuelve la fecha de hoy en formato compacto "YYYYMMDD".
 * Útil para generar versiones con timestamp.
 *
 * @example
 * getTodayCompact() // "20240323"
 */
export function getTodayCompact(): string {
  return getTodayString().replace(/-/g, "");
}

/**
 * Genera una versión con timestamp automático.
 * Si la versión base ya incluye timestamp (formato X.X.YYYYMMDD), la retorna sin cambios.
 * Si no, agrega la fecha de hoy.
 *
 * @example
 * generateVersionWithTimestamp("1.0")           // "1.0.20240323"
 * generateVersionWithTimestamp("1.0.20240320")  // "1.0.20240320" (sin cambios)
 * generateVersionWithTimestamp("2024.01")       // "2024.01.20240323"
 *
 * @param baseVersion - Versión base (ej: "1.0", "2024.01")
 * @returns Versión con timestamp
 */
export function generateVersionWithTimestamp(baseVersion: string): string {
  // Si ya tiene timestamp (termina en .YYYYMMDD), no modificar
  if (/\.\d{8}$/.test(baseVersion)) {
    return baseVersion;
  }

  return `${baseVersion}.${getTodayCompact()}`;
}

/**
 * Extrae la versión base (sin timestamp) de una versión con timestamp.
 *
 * @example
 * extractBaseVersion("1.0.20240323")  // "1.0"
 * extractBaseVersion("2024.01")       // "2024.01"
 * extractBaseVersion("1.0")           // "1.0"
 *
 * @param version - Versión completa
 * @returns Versión base sin timestamp
 */
export function extractBaseVersion(version: string): string {
  // Si termina en .YYYYMMDD, remover esa parte
  if (/\.\d{8}$/.test(version)) {
    return version.slice(0, -9); // Remueve ".YYYYMMDD"
  }
  return version;
}

/**
 * Extrae el timestamp de una versión con timestamp.
 *
 * @example
 * extractVersionTimestamp("1.0.20240323")  // "20240323"
 * extractVersionTimestamp("1.0")           // null
 *
 * @param version - Versión completa
 * @returns Timestamp o null si no tiene
 */
export function extractVersionTimestamp(version: string): string | null {
  const match = version.match(/\.(\d{8})$/);
  return match ? match[1] : null;
}

/**
 * Formatea un timestamp de versión (YYYYMMDD) a formato legible.
 *
 * @example
 * formatVersionTimestamp("20240323") // "23 mar 2024"
 * formatVersionTimestamp(null)       // null
 *
 * @param timestamp - Timestamp en formato YYYYMMDD
 * @returns Fecha formateada o null
 */
export function formatVersionTimestamp(
  timestamp: string | null,
): string | null {
  if (!timestamp || !/^\d{8}$/.test(timestamp)) return null;

  const dateString = `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`;
  return formatDate(dateString);
}

/**
 * Genera una versión sugerida basada en la versión actual.
 * Útil para mostrar en el UI del wizard de importación.
 *
 * @example
 * // Sin versión previa
 * suggestNextVersion(null)              // "1.0.20240323"
 *
 * // Con versión previa
 * suggestNextVersion("1.0.20240320")    // "1.0.20240323"
 * suggestNextVersion("2024.01.20240101") // "2024.01.20240323"
 *
 * @param currentVersion - Versión actual del catálogo (puede ser null)
 * @returns Versión sugerida con timestamp de hoy
 */
export function suggestNextVersion(
  currentVersion: string | null | undefined,
): string {
  const today = getTodayCompact();

  if (!currentVersion) {
    return `1.0.${today}`;
  }

  const baseVersion = extractBaseVersion(currentVersion);
  return `${baseVersion}.${today}`;
}

// ──────────────────────────────────────────────
// CONTRATO ENTRE CAPAS
// ──────────────────────────────────────────────

// ┌─────────────────────────────────────────────────────────────────┐
// │  INPUT del usuario                                              │
// │  <input type="date">      → string "YYYY-MM-DD"                 │
// │  <input type="datetime-local"> → string "YYYY-MM-DDTHH:mm"      │
// └────────────────────┬────────────────────────────────────────────┘
//                      │  toApi*() usa localInputToUtcIso()
//                      ▼
// ┌─────────────────────────────────────────────────────────────────┐
// │  REQUEST al backend (snake_case)                                │
// │  { scheduled_departure: "2025-03-10T18:00:00.000Z" }  ← UTC    │
// │  { birth_date: "1990-05-15" }                          ← DATE   │
// └────────────────────┬────────────────────────────────────────────┘
//                      │
//                      ▼
// ┌─────────────────────────────────────────────────────────────────┐
// │  PostgreSQL                                                      │
// │  TIMESTAMPTZ → almacena UTC, sin ambigüedad                     │
// │  DATE        → almacena solo fecha, sin timezone                 │
// └────────────────────┬────────────────────────────────────────────┘
//                      │  mapper usa pgDateToString()
//                      ▼
// ┌─────────────────────────────────────────────────────────────────┐
// │  RESPONSE del backend (camelCase en entity)                     │
// │  { scheduledDeparture: "2025-03-10T18:00:00.000Z" }             │
// │  { birthDate: "1990-05-15" }                                    │
// └────────────────────┬────────────────────────────────────────────┘
//                      │  formatDate() / formatDateTime()
//                      ▼
// ┌─────────────────────────────────────────────────────────────────┐
// │  DISPLAY para el usuario                                        │
// │  "10 mar 2025, 12:00 p.m."  ← hora México                      │
// │  "15 may 1990"                                                  │
// └─────────────────────────────────────────────────────────────────┘
