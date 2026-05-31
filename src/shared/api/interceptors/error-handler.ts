/**
 * @file error-handler.ts
 * @description Manejo centralizado de errores de la API.
 * Ubicación: src/shared/api/errors/error-handler.ts
 */

import type { AxiosError, AxiosInstance } from "axios";

// ============================================================================
// TIPOS
// ============================================================================

export interface ZodIssue {
  code: string;
  path: (string | number)[];
  message: string;
}

export interface ValidationFieldError {
  field: string;
  label: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: {
    issues?: ZodIssue[];
    [key: string]: unknown;
  };
}

// ============================================================================
// LABELS DE CAMPOS (snake_case -> español)
// ============================================================================

const FIELD_LABELS: Record<string, string> = {
  // Vehículos
  unit_number: "Número de unidad",
  license_plate: "Placa",
  vin: "VIN",
  brand: "Marca",
  model: "Modelo",
  year: "Año",
  type: "Tipo",
  color: "Color",
  load_capacity: "Capacidad de carga",
  volume_capacity: "Capacidad de volumen",
  fuel_tank_capacity: "Capacidad del tanque",
  expected_fuel_efficiency: "Rendimiento esperado",
  current_mileage: "Kilometraje actual",
  insurance_policy: "Póliza de seguro",
  insurance_expiry: "Vencimiento del seguro",
  sct_permit_number: "Número de permiso SCT",
  sct_permit_expiry: "Vencimiento del permiso SCT",
  status: "Estado",
  is_active: "Activo",
  // Conductores
  first_name: "Nombre",
  last_name: "Apellidos",
  curp: "CURP",
  rfc: "RFC",
  license_number: "Número de licencia",
  license_expiry: "Vencimiento de licencia",
  phone: "Teléfono",
  email: "Correo electrónico",
  // Viajes
  trip_code: "Código de viaje",
  client_id: "Cliente",
  vehicle_id: "Vehículo",
  driver_id: "Conductor",
  scheduled_departure: "Salida programada",
  scheduled_arrival: "Llegada estimada",
  origin: "Origen",
  destination: "Destino",
  // Generales
  name: "Nombre",
  description: "Descripción",
  password: "Contraseña",
};

function getFieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const lastSegment = field.split(".").pop() || field;
  if (FIELD_LABELS[lastSegment]) return FIELD_LABELS[lastSegment];
  return lastSegment
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ============================================================================
// MENSAJES DE ERROR
// ============================================================================

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "Solicitud inválida. Verifica los datos enviados.",
  401: "Sesión expirada. Inicia sesión para continuar.",
  403: "No tienes permisos para realizar esta acción.",
  404: "Recurso no encontrado.",
  500: "Error interno del servidor. Intenta más tarde.",
};

/**
 * Mensajes amigables para códigos de error del negocio
 *
 * Agregar aquí los códigos de error de cada módulo del ERP.
 * El interceptor usará estos mensajes en lugar del mensaje raw del backend.
 */
const BUSINESS_ERROR_MESSAGES: Record<string, string> = {
  // ── Vehículos ──────────────────────────────────────────────────────────────
  UNIT_NUMBER_EXISTS: "El número de unidad ya está registrado",
  LICENSE_PLATE_EXISTS: "La placa ya está registrada",
  VEHICLE_NOT_FOUND: "Vehículo no encontrado",
  VEHICLE_ON_TRIP: "No se puede modificar un vehículo en viaje",
  VEHICLE_NOT_ASSIGNABLE: "El vehículo no puede ser asignado",
  VEHICLE_ALREADY_ASSIGNED: "El vehículo ya está asignado en esas fechas",
  INVALID_STATUS_TRANSITION: "Transición de estado no permitida",
  INVALID_MILEAGE: "El kilometraje no puede ser menor al actual",

  // ── Conductores ────────────────────────────────────────────────────────────
  DRIVER_NOT_FOUND: "Conductor no encontrado",
  DRIVER_NOT_ASSIGNABLE: "El conductor no puede ser asignado",
  DRIVER_ALREADY_ASSIGNED: "El conductor ya está asignado en esas fechas",
  LICENSE_NUMBER_EXISTS: "El número de licencia ya está registrado",
  CURP_EXISTS: "El CURP ya está registrado",
  RFC_EMPLOYEE_EXISTS: "El RFC ya está registrado",
  EMPLOYEE_DRIVER_ON_TRIP:
    "No se puede dar de baja al empleado mientras está en viaje como conductor. Finalice o cancele el viaje en curso.",
  EMPLOYEE_DRIVER_HAS_ACTIVE_TRIPS:
    "No se puede dar de baja al empleado con viajes activos como conductor. Complete o cancele esos viajes primero.",
  EMPLOYEE_IS_ACTIVE_DRIVER:
    "No se puede dar de baja al empleado mientras sigue registrado como conductor activo. Revise Conductores o los viajes asignados.",

  // ── Empleados ──────────────────────────────────────────────────────────────
  EMPLOYEE_NOT_FOUND: "Empleado no encontrado",
  EMPLOYEE_ALREADY_TERMINATED: "El empleado ya está dado de baja",

  // ── Facturación ────────────────────────────────────────────────────────────
  TRIP_ALREADY_INVOICED: "El viaje ya está vinculado a una factura activa",
  COMPANY_SETTINGS_INCOMPLETE: "Configura los datos del emisor en Configuración → Empresa antes de facturar",
  PAC_NOT_IMPLEMENTED: "El PAC configurado no está disponible. Ve a Configuración → Facturación.",
  PAC_CONFIG_ERROR: "Error de configuración del PAC. Verifica las variables de entorno del servidor.",

  // ── Viajes ─────────────────────────────────────────────────────────────────
  TRIP_NOT_FOUND: "Viaje no encontrado",
  TRIP_CANNOT_BE_MODIFIED:
    "El viaje no puede ser modificado en su estado actual",
  INVALID_TRIP_STATUS_TRANSITION: "Transición de estado del viaje no permitida",
  TRIP_CODE_EXISTS: "El código de viaje ya existe",
  FISCAL_PRECONDITION_FAILED:
    "No se puede iniciar el viaje: falta cumplir la precondición fiscal (p. ej. factura timbrada). Revise la sección Fiscal o genere/timbre la factura del viaje.",

  // ── Clientes ───────────────────────────────────────────────────────────────
  CLIENT_NOT_FOUND: "Cliente no encontrado",
  CLIENT_NOT_ASSIGNABLE: "El cliente no puede asignarse a este viaje",
  RFC_EXISTS: "El RFC ya está registrado",
  CLIENT_CODE_EXISTS: "El código de cliente ya existe",

  // ── Autenticación ──────────────────────────────────────────────────────────
  UNAUTHORIZED: "Sesión expirada. Por favor, inicia sesión nuevamente",
  FORBIDDEN: "No tienes permisos para realizar esta acción",
  INVALID_CREDENTIALS: "Credenciales inválidas",
  USER_NOT_FOUND: "Usuario no encontrado",
  EMAIL_EXISTS: "El correo electrónico ya está registrado",
  INVALID_TOKEN: "Token inválido o expirado",

  // ── Validación ─────────────────────────────────────────────────────────────
  VALIDATION_ERROR: "Error de validación en los datos enviados",
  INVALID_QUERY: "Parámetros de búsqueda inválidos",

  // ── Generales ──────────────────────────────────────────────────────────────
  NOT_FOUND: "Recurso no encontrado",
  INTERNAL_ERROR: "Error interno del servidor",
  UPDATE_FAILED: "Error al actualizar el registro",
  DELETE_FAILED: "Error al eliminar el registro",
  CREATE_FAILED: "Error al crear el registro",
};

// ============================================================================
// CLASE ApiError
// ============================================================================

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;
  public readonly validationErrors: ValidationFieldError[];
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>,
    validationErrors: ValidationFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.validationErrors = validationErrors;
    this.isNetworkError = status === 0;
    this.isTimeout = code === "TIMEOUT";

    const Capture = Error as unknown as {
      captureStackTrace?: (err: Error, ctor: unknown) => void;
    };
    if (typeof Capture.captureStackTrace === "function") {
      Capture.captureStackTrace(this, ApiError);
    }
  }

  static fromAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
    if (error.code === "ECONNABORTED") {
      return new ApiError("La solicitud tardó demasiado.", 0, "TIMEOUT");
    }

    if (!error.response) {
      return new ApiError("Error de conexión.", 0, "NETWORK_ERROR");
    }

    const { status, data } = error.response;
    const code = data?.code;
    const details = data?.details as Record<string, unknown> | undefined;
    const validationErrors = extractValidationErrors(details);
    const message = getMessageForError(status, code, data, validationErrors);

    return new ApiError(message, status, code, details, validationErrors);
  }

  // Métodos de verificación
  isUnauthorized(): boolean {
    return this.status === 401;
  }
  isForbidden(): boolean {
    return this.status === 403;
  }
  isNotFound(): boolean {
    return this.status === 404;
  }
  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }
  isServerError(): boolean {
    return this.status >= 500;
  }
  hasValidationErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  /** Mensaje corto para toast */
  getToastMessage(): string {
    if (!this.validationErrors.length) return this.message;
    const first = this.validationErrors[0];
    if (this.validationErrors.length === 1) {
      return `${first.label}: ${first.message}`;
    }
    return `${first.label}: ${first.message} (+${this.validationErrors.length - 1} más)`;
  }

  /** Mensaje detallado con múltiples líneas */
  getDetailedMessage(maxErrors: number = 3): string {
    if (!this.validationErrors.length) return this.message;
    const errors = this.validationErrors.slice(0, maxErrors);
    const lines = errors.map((e) => `• ${e.label}: ${e.message}`);
    if (this.validationErrors.length > maxErrors) {
      lines.push(
        `• ...y ${this.validationErrors.length - maxErrors} error(es) más`,
      );
    }
    return lines.join("\n");
  }

  /** Para React Hook Form setError */
  getFieldErrors(): Record<string, string> {
    return this.validationErrors.reduce(
      (acc, e) => {
        acc[e.field] = e.message;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  /** Lista de errores para UI */
  getErrorList(): ValidationFieldError[] {
    return this.validationErrors;
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function extractValidationErrors(
  details?: Record<string, unknown>,
): ValidationFieldError[] {
  if (!details) return [];

  let issues: ZodIssue[] | undefined;

  // Caso 1: details.message es un string JSON (tu caso actual)
  if (typeof details.message === "string") {
    try {
      const parsed = JSON.parse(details.message);
      if (Array.isArray(parsed)) {
        issues = parsed as ZodIssue[];
      }
    } catch {
      // No es JSON válido, ignorar
    }
  }
  // Caso 2: details.message ya es un array
  else if (Array.isArray(details.message)) {
    issues = details.message as ZodIssue[];
  }
  // Caso 3: details.issues es un array
  else if (Array.isArray(details.issues)) {
    issues = details.issues as ZodIssue[];
  }

  if (!issues || issues.length === 0) return [];

  return issues.map((issue) => {
    const field = issue.path?.join(".") || "general";
    return {
      field,
      label: getFieldLabel(field),
      message: translateZodMessage(issue.message),
    };
  });
}

/**
 * Traduce mensajes comunes de Zod a español
 */
function translateZodMessage(message: string): string {
  const translations: Record<string, string> = {
    "Invalid ISO date": "Fecha inválida",
    Required: "Campo requerido",
    "Expected string, received number": "Se esperaba texto",
    "Expected number, received string": "Se esperaba un número",
    "String must contain at least 1 character(s)": "Campo requerido",
    "Invalid email": "Correo electrónico inválido",
    "Invalid date": "Fecha inválida",
    "Number must be greater than 0": "Debe ser mayor a 0",
    "Number must be positive": "Debe ser un número positivo",
    "Invalid enum value": "Valor no permitido",
  };

  return translations[message] || message;
}

function getMessageForError(
  status: number,
  code: string | undefined,
  data: ApiErrorResponse | undefined,
  validationErrors: ValidationFieldError[],
): string {
  // 1. Errores de validación: mostrar detalles de campos
  if (code === "VALIDATION_ERROR" && validationErrors.length > 0) {
    const first = validationErrors[0];
    if (validationErrors.length === 1) {
      return `${first.label}: ${first.message}`;
    }
    return `${first.label}: ${first.message} (+${validationErrors.length - 1} más)`;
  }

  // 2. Para errores de negocio (4xx): el backend es la fuente de verdad.
  //    Mostramos data.error directamente porque el mensaje ya viene en español
  //    y contiene contexto específico (ej: el trip_code del viaje conflictivo).
  //    El diccionario BUSINESS_ERROR_MESSAGES queda como fallback para backends
  //    que solo envían un code sin mensaje (o mensajes genéricos en inglés).
  if (status < 500 && data?.error && typeof data.error === "string") {
    return data.error;
  }

  // 3. Diccionario frontend por código (fallback para 4xx sin mensaje, y para 5xx)
  if (code && BUSINESS_ERROR_MESSAGES[code]) {
    return BUSINESS_ERROR_MESSAGES[code];
  }

  // 4. Mensaje del backend como último recurso (ej: 500 sin code conocido)
  if (data?.error && typeof data.error === "string") {
    return data.error;
  }

  // 5. Genérico por status HTTP
  return HTTP_STATUS_MESSAGES[status] || "Ocurrió un error inesperado.";
}

// ============================================================================
// TYPE GUARDS & UTILS
// ============================================================================

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const isAxiosError = (
  error: unknown,
): error is AxiosError<ApiErrorResponse> => {
  return (error as AxiosError)?.isAxiosError === true;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) return error.message;
  if (isAxiosError(error)) return ApiError.fromAxiosError(error).message;
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
};

export const getValidationErrors = (error: unknown): ValidationFieldError[] => {
  if (isApiError(error)) return error.validationErrors;
  return [];
};

// ============================================================================
// INTERCEPTOR
// ============================================================================

export function setupErrorInterceptor(instance: AxiosInstance): () => void {
  const id = instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status;
      /**
       * Axios encadena los interceptors en orden de registro: primero el de este archivo,
       * después `setupAuthInterceptor`. Si aquí convertimos 401/403 a `ApiError`, el
       * siguiente handler ya no ve `error.response` y no puede refrescar token ni
       * despachar `onForbidden` correctamente.
       */
      if (status === 401 || status === 403) {
        return Promise.reject(error);
      }
      return Promise.reject(ApiError.fromAxiosError(error));
    },
  );
  return () => instance.interceptors.response.eject(id);
}

/**
 * Formatea errores de validación Zod para mostrar al usuario
 */
// function formatValidationErrors(details: Record<string, unknown>): string {
//   try {
//     // Estructura de ZodError: { issues: [{ path: [...], message: string }] }
//     if ("issues" in details && Array.isArray(details.issues)) {
//       const issues = details.issues as Array<{
//         path: (string | number)[];
//         message: string;
//       }>;

//       if (issues.length === 0) {
//         return "Error de validación";
//       }

//       if (issues.length === 1) {
//         const issue = issues[0];
//         const field = issue.path.join(".");
//         return field ? `${field}: ${issue.message}` : issue.message;
//       }

//       // Múltiples errores: mostrar el primero con indicación de más
//       const firstIssue = issues[0];
//       const field = firstIssue.path.join(".");
//       const firstError = field
//         ? `${field}: ${firstIssue.message}`
//         : firstIssue.message;
//       return `${firstError} (+${issues.length - 1} error${issues.length > 2 ? "es" : ""} más)`;
//     }

//     return "Error de validación";
//   } catch {
//     return "Error de validación";
//   }
// }

/**
 * Extrae el código de error si existe
 */
// export const getErrorCode = (error: unknown): string | undefined => {
//   if (isApiError(error)) {
//     return error.code;
//   }

//   if (isAxiosError(error) && error.response?.data?.code) {
//     return error.response.data.code;
//   }

//   return undefined;
// };
