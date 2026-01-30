/**
 * Backend Error Mapper
 *
 * Utilidad para mapear códigos de error del backend a mensajes amigables en español.
 * Soporta AxiosError y otros tipos de errores.
 *
 * Ubicación sugerida: src/shared/utils/errorMapper.ts
 */

import { AxiosError } from "axios";

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
  EMPLOYEE_NUMBER_EXISTS: "El número de empleado ya existe",
  LICENSE_NUMBER_EXISTS: "El número de licencia ya está registrado",
  CURP_EXISTS: "El CURP ya está registrado",
  LICENSE_EXPIRED:
    "La fecha de vencimiento de la licencia no puede ser en el pasado",

  // ===== CLIENTES =====
  CLIENT_NOT_FOUND: "El cliente seleccionado no existe",
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

  // ===== AUTENTICACIÓN Y AUTORIZACIÓN =====
  UNAUTHORIZED: "No tiene permisos para realizar esta acción",
  FORBIDDEN: "Acceso denegado",
  TOKEN_EXPIRED: "Su sesión ha expirado. Por favor inicie sesión nuevamente.",
  INVALID_TOKEN: "Token de autenticación inválido",

  // ===== ERRORES DE SERVIDOR =====
  INTERNAL_SERVER_ERROR: "Error interno del servidor. Intente nuevamente.",
  SERVICE_UNAVAILABLE: "Servicio no disponible. Intente más tarde.",
  NETWORK_ERROR: "Error de conexión. Verifique su conexión a internet.",
  TIMEOUT: "La operación tardó demasiado. Intente nuevamente.",

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
  error?: string;
  details?: unknown;
}

/**
 * Estructura de error anidada: error.response.data.error = { code, message, statusCode }
 * Esta es la estructura que usa tu backend
 */
export interface ApiErrorResponseWithNested extends ApiErrorResponse {
  error?: {
    code?: string;
    errorCode?: string;
    message?: string;
    statusCode?: number;
  };
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
  // ===== AXIOS ERROR =====
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
    const nestedError = (responseData as ApiErrorResponseWithNested).error;

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
      responseData.code ||
      responseData.errorCode ||
      getCodeFromStatus(statusCode);
    const originalMessage = responseData.message || responseData.error;

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
  const originalMessage = error.message || error.error;

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
