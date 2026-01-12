// src/shared/api/errorHandler.ts

import { AxiosError, isAxiosError } from "axios";
import { ApiErrorCode, type ApiErrorResponse } from "./types";

/**
 * Clase personalizada para errores de API
 * Extiende Error nativo para mejor integración con try/catch
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly details?: Record<string, string[]>;
  public readonly timestamp: string;
  public readonly isApiError = true;

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Mantiene el stack trace correcto en V8 (Chrome, Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Verifica si es un error de autenticación
   */
  get isAuthError(): boolean {
    return [
      ApiErrorCode.UNAUTHORIZED,
      ApiErrorCode.TOKEN_EXPIRED,
      ApiErrorCode.INVALID_TOKEN,
    ].includes(this.code);
  }

  /**
   * Verifica si es un error de permisos
   */
  get isPermissionError(): boolean {
    return [
      ApiErrorCode.FORBIDDEN,
      ApiErrorCode.INSUFFICIENT_PERMISSIONS,
    ].includes(this.code);
  }

  /**
   * Verifica si es un error de validación
   */
  get isValidationError(): boolean {
    return [ApiErrorCode.VALIDATION_ERROR, ApiErrorCode.INVALID_INPUT].includes(
      this.code
    );
  }

  /**
   * Verifica si es un error de red
   */
  get isNetworkError(): boolean {
    return [ApiErrorCode.NETWORK_ERROR, ApiErrorCode.TIMEOUT].includes(
      this.code
    );
  }

  /**
   * Verifica si el error es recuperable (puede reintentarse)
   */
  get isRetryable(): boolean {
    return (
      this.isNetworkError ||
      this.code === ApiErrorCode.SERVICE_UNAVAILABLE ||
      this.status >= 500
    );
  }

  /**
   * Obtiene el primer error de validación para un campo específico
   */
  getFieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }

  /**
   * Obtiene todos los errores de validación como un objeto plano
   */
  getFieldErrors(): Record<string, string> {
    if (!this.details) return {};

    return Object.entries(this.details).reduce((acc, [field, errors]) => {
      acc[field] = errors[0] || "Error de validación";
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Serializa el error para logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Mapeo de códigos HTTP a códigos de error de la aplicación
 */
const httpStatusToErrorCode: Record<number, ApiErrorCode> = {
  400: ApiErrorCode.VALIDATION_ERROR,
  401: ApiErrorCode.UNAUTHORIZED,
  403: ApiErrorCode.FORBIDDEN,
  404: ApiErrorCode.NOT_FOUND,
  409: ApiErrorCode.CONFLICT,
  422: ApiErrorCode.INVALID_INPUT,
  500: ApiErrorCode.INTERNAL_ERROR,
  502: ApiErrorCode.SERVICE_UNAVAILABLE,
  503: ApiErrorCode.SERVICE_UNAVAILABLE,
  504: ApiErrorCode.TIMEOUT,
};

/**
 * Mensajes de error por defecto según el código
 */
const defaultErrorMessages: Record<ApiErrorCode, string> = {
  [ApiErrorCode.UNAUTHORIZED]:
    "No has iniciado sesión. Por favor, inicia sesión para continuar.",
  [ApiErrorCode.TOKEN_EXPIRED]:
    "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
  [ApiErrorCode.INVALID_TOKEN]:
    "Sesión inválida. Por favor, inicia sesión nuevamente.",
  [ApiErrorCode.FORBIDDEN]: "No tienes permiso para realizar esta acción.",
  [ApiErrorCode.INSUFFICIENT_PERMISSIONS]:
    "No tienes los permisos necesarios para esta operación.",
  [ApiErrorCode.VALIDATION_ERROR]: "Los datos proporcionados no son válidos.",
  [ApiErrorCode.INVALID_INPUT]: "La información ingresada es incorrecta.",
  [ApiErrorCode.NOT_FOUND]: "El recurso solicitado no fue encontrado.",
  [ApiErrorCode.ALREADY_EXISTS]: "Este registro ya existe en el sistema.",
  [ApiErrorCode.CONFLICT]:
    "Existe un conflicto con el estado actual del recurso.",
  [ApiErrorCode.INTERNAL_ERROR]:
    "Ocurrió un error en el servidor. Por favor, intenta más tarde.",
  [ApiErrorCode.SERVICE_UNAVAILABLE]:
    "El servicio no está disponible temporalmente.",
  [ApiErrorCode.NETWORK_ERROR]:
    "Error de conexión. Verifica tu conexión a internet.",
  [ApiErrorCode.TIMEOUT]:
    "La solicitud tardó demasiado. Por favor, intenta nuevamente.",
  [ApiErrorCode.UNKNOWN]: "Ocurrió un error inesperado.",
};

/**
 * Parsea la respuesta de error del servidor
 */
const parseServerError = (data: unknown): Partial<ApiErrorResponse> => {
  if (!data || typeof data !== "object") {
    return {};
  }

  const errorData = data as Record<string, unknown>;

  return {
    code: errorData.code as ApiErrorCode | undefined,
    message: errorData.message as string | undefined,
    details: errorData.details as Record<string, string[]> | undefined,
  };
};

/**
 * Transforma un error de Axios en un ApiError
 */
export const handleAxiosError = (error: AxiosError): ApiError => {
  // Error de red (sin respuesta del servidor)
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return new ApiError(
        defaultErrorMessages[ApiErrorCode.TIMEOUT],
        ApiErrorCode.TIMEOUT,
        0
      );
    }

    return new ApiError(
      defaultErrorMessages[ApiErrorCode.NETWORK_ERROR],
      ApiErrorCode.NETWORK_ERROR,
      0
    );
  }

  const { status, data } = error.response;
  const serverError = parseServerError(data);

  // Determinar código de error
  const code =
    serverError.code || httpStatusToErrorCode[status] || ApiErrorCode.UNKNOWN;

  // Determinar mensaje
  const message = serverError.message || defaultErrorMessages[code];

  return new ApiError(message, code, status, serverError.details);
};

/**
 * Transforma cualquier error en un ApiError
 * Útil para catch blocks genéricos
 */
export const normalizeError = (error: unknown): ApiError => {
  // Ya es un ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Es un error de Axios
  if (isAxiosError(error)) {
    return handleAxiosError(error);
  }

  // Es un Error estándar
  if (error instanceof Error) {
    return new ApiError(
      error.message || defaultErrorMessages[ApiErrorCode.UNKNOWN],
      ApiErrorCode.UNKNOWN,
      0
    );
  }

  // Error desconocido
  return new ApiError(
    defaultErrorMessages[ApiErrorCode.UNKNOWN],
    ApiErrorCode.UNKNOWN,
    0
  );
};

/**
 * Type guard para verificar si un error es ApiError
 */
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError || (error as ApiError)?.isApiError === true;
};

/**
 * Obtiene un mensaje amigable para mostrar al usuario
 */
export const getErrorMessage = (error: unknown): string => {
  const apiError = normalizeError(error);
  return apiError.message;
};

/**
 * Logger de errores para desarrollo/producción
 */
export const logApiError = (error: ApiError, context?: string): void => {
  const logData = {
    context,
    ...error.toJSON(),
  };

  if (import.meta.env.DEV) {
    console.error("[API Error]", logData);
  } else {
    // En producción, enviar a servicio de logging (Sentry, DataDog, etc.)
    // Ejemplo: Sentry.captureException(error, { extra: logData });
    console.error("[API Error]", error.message);
  }
};
