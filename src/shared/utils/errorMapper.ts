/**
 * Backend Error Mapper
 *
 * Utilidad para mapear códigos de error del backend a mensajes amigables en español.
 * Soporta AxiosError y otros tipos de errores.
 *
 * Ubicación sugerida: src/shared/utils/errorMapper.ts
 */

import { AxiosError } from "axios";
import { isApiError } from "@shared/api/interceptors/error-handler";

// ============================================================================
// ERROR MESSAGES DICTIONARY
// ============================================================================

/**
 * Mapeo completo de códigos de error del backend a mensajes en español
 */
export const BACKEND_ERROR_MESSAGES: Record<string, string> = {
  // ===== VEHÍCULOS =====
  VEHICLE_NOT_FOUND: "El vehículo seleccionado no existe",
  VEHICLE_INACTIVE: "El vehículo seleccionado no está activo",
  VEHICLE_NOT_AVAILABLE:
    "El vehículo no está disponible (puede estar en otro viaje o en mantenimiento)",
  VEHICLE_ON_TRIP: "No se puede modificar un vehículo que está en viaje",
  UNIT_NUMBER_EXISTS: "El número de unidad ya existe",
  LICENSE_PLATE_EXISTS: "La placa ya está registrada",

  // ===== CONDUCTORES =====
  DRIVER_NOT_FOUND: "El conductor seleccionado no existe",
  DRIVER_INACTIVE: "El conductor seleccionado no está activo",
  DRIVER_NOT_AVAILABLE:
    "El conductor no está disponible (puede estar en otro viaje o descansando)",
  DRIVER_ON_TRIP: "No se puede modificar un conductor que está en viaje",
  DRIVER_LICENSE_EXPIRED:
    "La licencia del conductor ha expirado. Seleccione otro conductor o actualice la licencia.",
  DRIVER_TERMINATED: "No se puede modificar un conductor dado de baja",
  EMPLOYEE_DRIVER_ON_TRIP:
    "No se puede dar de baja al empleado mientras está en viaje como conductor. Finalice o cancele el viaje en curso.",
  EMPLOYEE_DRIVER_HAS_ACTIVE_TRIPS:
    "No se puede dar de baja al empleado con viajes activos como conductor. Complete o cancele esos viajes primero.",
  /** @deprecated Código legacy; el API ya valida viajes activos / on_trip */
  EMPLOYEE_IS_ACTIVE_DRIVER:
    "No se puede dar de baja al empleado mientras sigue registrado como conductor activo. Revise Conductores o los viajes asignados.",
  EMPLOYEE_NUMBER_EXISTS: "El número de empleado ya existe",
  LICENSE_NUMBER_EXISTS: "El número de licencia ya está registrado",
  CURP_EXISTS: "El CURP ya está registrado",
  LICENSE_EXPIRED:
    "La fecha de vencimiento de la licencia no puede ser en el pasado",

  // ===== CLIENTES =====
  CLIENT_NOT_FOUND: "El cliente seleccionado no existe",
  CLIENT_NOT_ASSIGNABLE: "El cliente no puede asignarse a este viaje",
  CLIENT_INACTIVE: "El cliente seleccionado no está activo",
  CLIENT_HAS_ACTIVE_TRIPS: "No se puede eliminar un cliente con viajes activos",
  TAX_ID_EXISTS: "El RFC ya está registrado",
  INVALID_CREDIT_DAYS:
    "Los días de crédito deben ser mayores a 0 para clientes a crédito",

  // ===== VIAJES =====
  TRIP_NOT_FOUND: "El viaje no existe",
  INVALID_TRIP_REFERENCES: "El viaje tiene referencias inválidas",
  TRIP_NOT_IN_PROGRESS: "El viaje no está en curso",
  TRIP_NOT_DELETABLE: "Solo se pueden eliminar viajes en estado borrador",
  TRIP_NOT_EDITABLE:
    "Solo se pueden editar viajes en estado borrador o programado",
  INVALID_END_MILEAGE: "El kilometraje final no puede ser menor al inicial",
  INVALID_STATUS_TRANSITION: "No se puede cambiar a este estado",
  VEHICLE_ALREADY_ASSIGNED:
    "El vehículo ya está asignado a otro viaje en esa fecha",
  DRIVER_ALREADY_ASSIGNED:
    "El conductor ya está asignado a otro viaje en esa fecha",

  // ===== VALIDACIÓN GENERAL =====
  VALIDATION_ERROR: "Error de validación en los datos enviados",
  INVALID_QUERY: "Parámetros de búsqueda inválidos",
  INVALID_DEPARTURE_DATE: "La fecha de salida no es válida",
  INVALID_ARRIVAL_DATE: "La fecha de llegada debe ser posterior a la de salida",
  INVALID_MILEAGE: "El kilometraje no puede ser negativo",

  // ===== ERRORES DE OPERACIÓN =====
  CREATE_TRIP_ERROR: "Error al crear el viaje",
  UPDATE_FAILED: "Error al actualizar",
  DELETE_FAILED: "Error al eliminar",
  FINISH_FAILED: "Error al finalizar el viaje",
  GET_FAILED: "Error al obtener los datos",

  // ===== PLAN / LÍMITES (WS-D) =====
  USER_LIMIT_REACHED:
    "Tu plan permite hasta 3 usuarios. Contacta a soporte para ampliar tu plan.",
  BRANCH_LIMIT_REACHED:
    "Tu plan permite 1 sucursal. Contacta a soporte para ampliar tu plan.",
  BRANCH_NOT_PLAN_ELIGIBLE:
    "Esta sucursal excede la capacidad de tu plan. Ajusta sucursales o mejora tu plan.",
  BRANCH_OVER_QUOTA_BLOCKS_PLAN_CHANGE:
    "El tenant tiene más sucursales activas de las que permite el plan destino. Consolida sucursales antes de asignar este plan.",
  BRANCH_RECONCILE_INVALID_SELECTION:
    "La selección de sucursales para ajustar al plan no es válida.",
  BRANCH_CODE_EXISTS:
    "Ya existe una sucursal activa con ese código. Elige otro código.",
  MAIN_BRANCH_EXISTS:
    "Ya existe una sucursal principal activa. Designa otra matriz antes de continuar.",
  MAIN_BRANCH_DELETE_BLOCKED:
    "No se puede eliminar la sucursal principal. Designa otra matriz antes de continuar.",

  // ===== PLAN / BILLING SaaS =====
  MODULE_NOT_ENTITLED:
    "Este módulo no está activo en tu cuenta. Contacta a Boeltech para activarlo.",

  // ===== FACTURACIÓN (OP-L0.3 retención PM) =====
  PERSONA_MORAL_RETENTION_REQUIRED:
    "La retención IVA del 4% es obligatoria para receptores persona moral con conceptos gravados.",
  PERSONA_MORAL_RETENTION_INCOHERENT:
    "Los importes de retención no coinciden con el 4% requerido para persona moral.",
  INVOICE_CONCEPTS_INVALID:
    "Las partidas de la factura no son coherentes con los importes totales.",

  // ===== AUTENTICACIÓN Y AUTORIZACIÓN =====
  INVALID_CREDENTIALS:
    "Credenciales incorrectas. Verifica tu correo y contraseña.",
  TENANT_NOT_FOUND: "Empresa no encontrada. Verifica el identificador.",
  USER_INACTIVE: "Tu cuenta de usuario está inactiva.",
  TENANT_SUSPENDED: "La cuenta de esta empresa está suspendida.",
  UNAUTHORIZED: "No tiene permisos para realizar esta acción",
  FORBIDDEN: "Acceso denegado",
  TOO_MANY_REQUESTS: "Demasiados intentos. Espera unos minutos.",
  TOKEN_EXPIRED: "Su sesión ha expirado. Por favor inicie sesión nuevamente.",
  INVALID_TOKEN: "Token de autenticación inválido",

  // ===== ERRORES DE SERVIDOR =====
  INTERNAL_SERVER_ERROR: "Error interno del servidor. Intente nuevamente.",
  SERVICE_UNAVAILABLE: "Servicio no disponible. Intente más tarde.",
  NETWORK_ERROR: "Error de conexión. Verifique su conexión a internet.",
  TIMEOUT: "La operación tardó demasiado. Intente nuevamente.",

  // ===== CATÁLOGOS =====
  CATALOG_CSV_TYPE_MISMATCH:
    "El archivo CSV no corresponde al tipo de catálogo seleccionado. Verifica el catálogo y vuelve a intentar.",
  CATALOG_NOT_IMPORTABLE:
    "Este catálogo no admite importación masiva desde CSV.",
  EMPTY_CSV: "El archivo CSV está vacío o no tiene encabezados.",
  NO_DATA_ROWS: "El archivo CSV no contiene filas de datos.",

  // ===== ERRORES GENÉRICOS =====
  UNKNOWN_ERROR: "Ha ocurrido un error inesperado",
  NOT_FOUND: "Recurso no encontrado",
  BAD_REQUEST: "Solicitud inválida",
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface MappedError {
  code: string;
  message: string;
  originalMessage?: string;
  statusCode?: number;
}

export interface ApiErrorResponse {
  code?: string;
  errorCode?: string;
  message?: string;
  /** Plano (string) o objeto anidado según backend */
  error?:
    | string
    | {
        code?: string;
        errorCode?: string;
        message?: string;
        statusCode?: number;
      };
  details?: unknown;
}

export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

function pickStringMessage(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
    if (typeof c === "object" && c !== null && "message" in c) {
      const m = (c as { message?: unknown }).message;
      if (typeof m === "string" && m.trim()) return m;
    }
  }
  return undefined;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si el error es un AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}

// ============================================================================
// ERROR MAPPING FUNCTIONS
// ============================================================================

/**
 * Mapea un error del backend a un mensaje amigable en español
 * Soporta AxiosError, Error estándar, objetos y strings
 */
export function mapBackendError(error: unknown): MappedError {
  // ===== API ERROR (ya procesado por el interceptor de respuesta) =====
  // El interceptor convierte AxiosError → ApiError antes de que llegue aquí.
  // ApiError ya tiene el `code` extraído del backend — solo lo mapeamos.
  if (isApiError(error)) {
    const code = error.code || "UNKNOWN_ERROR";
    // Preferimos el mensaje del ApiError porque ya incluye contexto específico
    // del backend (ej: el trip_code del viaje conflictivo).
    // Solo caemos al diccionario si el mensaje está vacío.
    return {
      code,
      message:
        error.message ||
        BACKEND_ERROR_MESSAGES[code] ||
        BACKEND_ERROR_MESSAGES.UNKNOWN_ERROR,
      originalMessage: error.message,
      statusCode: error.status,
    };
  }

  // ===== AXIOS ERROR (sin interceptor activo, ej: tests) =====
  if (isAxiosError(error)) {
    return handleAxiosError(error);
  }

  // ===== ERROR ESTÁNDAR =====
  if (error instanceof Error) {
    return parseErrorMessage(error.message);
  }

  // ===== OBJETO CON ESTRUCTURA DE API =====
  if (typeof error === "object" && error !== null) {
    return handleObjectError(error as ApiErrorResponse);
  }

  // ===== STRING =====
  if (typeof error === "string") {
    return parseErrorMessage(error);
  }

  // ===== FALLBACK =====
  return {
    code: "UNKNOWN_ERROR",
    message: BACKEND_ERROR_MESSAGES.UNKNOWN_ERROR,
  };
}

/**
 * Maneja errores de Axios específicamente
 * Soporta múltiples estructuras de respuesta:
 * - error.response.data.error.code (tu backend)
 * - error.response.data.code (estructura plana)
 */
function handleAxiosError(error: AxiosError<ApiErrorResponse>): MappedError {
  const statusCode = error.response?.status;
  const responseData = error.response?.data;

  // Si no hay respuesta (error de red)
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return {
        code: "TIMEOUT",
        message: BACKEND_ERROR_MESSAGES.TIMEOUT,
        statusCode: 0,
      };
    }
    return {
      code: "NETWORK_ERROR",
      message: BACKEND_ERROR_MESSAGES.NETWORK_ERROR,
      statusCode: 0,
    };
  }

  // Si hay datos en la respuesta
  if (responseData) {
    // Estructura 1: error.response.data.error = { code, message, statusCode }
    // Esta es la estructura de tu backend
    const nestedError = (responseData as ApiErrorResponse).error;

    if (nestedError && typeof nestedError === "object") {
      const code =
        nestedError.code ||
        nestedError.errorCode ||
        getCodeFromStatus(statusCode);
      const originalMessage = nestedError.message;

      return {
        code,
        message:
          BACKEND_ERROR_MESSAGES[code] ||
          originalMessage ||
          getMessageFromStatus(statusCode),
        originalMessage,
        statusCode: nestedError.statusCode || statusCode,
      };
    }

    // Estructura 2: error.response.data = { code, message } (estructura plana)
    const code =
      (typeof responseData.code === "string" && responseData.code) ||
      (typeof responseData.errorCode === "string" && responseData.errorCode) ||
      getCodeFromStatus(statusCode);
    const originalMessage = pickStringMessage(
      responseData.message,
      responseData.error,
    );

    return {
      code,
      message:
        BACKEND_ERROR_MESSAGES[code] ||
        originalMessage ||
        getMessageFromStatus(statusCode),
      originalMessage,
      statusCode,
    };
  }

  // Solo tenemos el status code
  return {
    code: getCodeFromStatus(statusCode),
    message: getMessageFromStatus(statusCode),
    statusCode,
  };
}

/**
 * Maneja objetos de error genéricos
 */
function handleObjectError(error: ApiErrorResponse): MappedError {
  const code = error.code || error.errorCode || "UNKNOWN_ERROR";
  const originalMessage = pickStringMessage(error.message, error.error);

  return {
    code,
    message:
      BACKEND_ERROR_MESSAGES[code] ||
      originalMessage ||
      BACKEND_ERROR_MESSAGES.UNKNOWN_ERROR,
    originalMessage,
  };
}

/**
 * Parsea un mensaje de error (puede ser JSON o texto plano)
 */
function parseErrorMessage(message: string): MappedError {
  // Intentar parsear como JSON
  try {
    const parsed = JSON.parse(message) as ApiErrorResponse;
    return handleObjectError(parsed);
  } catch {
    // No es JSON, buscar código en el mensaje
    const code = extractErrorCode(message);
    return {
      code,
      message: BACKEND_ERROR_MESSAGES[code] || message,
      originalMessage: message,
    };
  }
}

/**
 * Extrae un código de error de un mensaje de texto
 */
function extractErrorCode(message: string): string {
  const upperMessage = message.toUpperCase();

  // Buscar códigos conocidos directamente en el mensaje
  for (const code of Object.keys(BACKEND_ERROR_MESSAGES)) {
    if (upperMessage.includes(code)) {
      return code;
    }
  }

  return "UNKNOWN_ERROR";
}

/**
 * Obtiene un código de error basado en el status HTTP
 */
function getCodeFromStatus(status?: number): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 408:
      return "TIMEOUT";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 500:
      return "INTERNAL_SERVER_ERROR";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return "UNKNOWN_ERROR";
  }
}

/**
 * Obtiene un mensaje basado en el status HTTP
 */
function getMessageFromStatus(status?: number): string {
  const code = getCodeFromStatus(status);
  return BACKEND_ERROR_MESSAGES[code] || BACKEND_ERROR_MESSAGES.UNKNOWN_ERROR;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene solo el mensaje de error (shorthand)
 */
export function getErrorMessage(error: unknown): string {
  return mapBackendError(error).message;
}

/**
 * Obtiene el código de error
 */
export function getErrorCode(error: unknown): string {
  return mapBackendError(error).code;
}

/**
 * Verifica si un error es de un tipo específico
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return mapBackendError(error).code === code;
}

/**
 * Verifica si es un error de autenticación
 */
export function isAuthError(error: unknown): boolean {
  const mapped = mapBackendError(error);
  return [
    "UNAUTHORIZED",
    "FORBIDDEN",
    "TOKEN_EXPIRED",
    "INVALID_TOKEN",
  ].includes(mapped.code);
}

/**
 * Verifica si es un error de red
 */
export function isNetworkError(error: unknown): boolean {
  const mapped = mapBackendError(error);
  return ["NETWORK_ERROR", "TIMEOUT", "SERVICE_UNAVAILABLE"].includes(
    mapped.code,
  );
}

/**
 * Verifica si es un error de validación
 */
export function isValidationError(error: unknown): boolean {
  const mapped = mapBackendError(error);
  return mapped.code === "VALIDATION_ERROR" || mapped.statusCode === 400;
}

// ============================================================================
// RESULT TYPE HELPERS
// ============================================================================

export type UseCaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: MappedError };

export type ValidationResult =
  | { success: true }
  | { success: false; error: { code: string; message: string } };

export type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError };

/**
 * Crea un resultado exitoso
 */
export function successResult<T>(data: T): UseCaseResult<T> {
  return { success: true, data };
}

/**
 * Crea un resultado de error
 */
export function errorResult<T>(error: unknown): UseCaseResult<T> {
  return { success: false, error: mapBackendError(error) };
}
