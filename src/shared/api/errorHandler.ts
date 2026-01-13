import { AxiosError } from "axios";

/**
 * Estructura de error de la API
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Clase personalizada para errores de API
 *
 * Extiende Error nativo y agrega información útil del response
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetworkError = status === 0;
    this.isTimeout = code === "ECONNABORTED";

    // Mantener el stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Crea un ApiError desde un AxiosError
   */
  static fromAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
    // Error de red (sin response)
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return new ApiError(
          "La solicitud tardó demasiado. Intenta de nuevo.",
          0,
          "TIMEOUT"
        );
      }
      return new ApiError(
        "Error de conexión. Verifica tu conexión a internet.",
        0,
        "NETWORK_ERROR"
      );
    }

    const { status, data } = error.response;
    const message = data?.error || data?.message || getDefaultMessage(status);
    const code = data?.code;
    const details = data?.details;

    return new ApiError(message, status, code, details);
  }

  /**
   * Verifica si es un error de autenticación
   */
  isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * Verifica si es un error de permisos
   */
  isForbidden(): boolean {
    return this.status === 403;
  }

  /**
   * Verifica si es un error de recurso no encontrado
   */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Verifica si es un error de validación
   */
  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  /**
   * Verifica si es un error del servidor
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Type guard para verificar si un error es ApiError
 */
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

/**
 * Type guard para verificar si un error es AxiosError
 */
export const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError)?.isAxiosError === true;
};

/**
 * Obtiene un mensaje por defecto según el status code
 */
const getDefaultMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: "Solicitud inválida. Verifica los datos enviados.",
    401: "No autenticado. Inicia sesión para continuar.",
    403: "No tienes permisos para realizar esta acción.",
    404: "Recurso no encontrado.",
    409: "Conflicto con el estado actual del recurso.",
    422: "Los datos enviados no son válidos.",
    429: "Demasiadas solicitudes. Espera un momento.",
    500: "Error interno del servidor. Intenta más tarde.",
    502: "El servidor no está disponible temporalmente.",
    503: "Servicio no disponible. Intenta más tarde.",
    504: "El servidor tardó demasiado en responder.",
  };

  return messages[status] || "Ocurrió un error inesperado.";
};

/**
 * Extrae el mensaje de error de cualquier tipo de error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }

  if (isAxiosError(error)) {
    return ApiError.fromAxiosError(error).message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
};
