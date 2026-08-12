/**
 * @file error-handler.ts
 * @description Manejo centralizado de errores de la API.
 * Ubicación: src/shared/api/errors/error-handler.ts
 */

import type { AxiosError, AxiosInstance } from "axios";
import {
  captureWebException,
} from "@shared/observability/sentry";
import {
  shouldCaptureApiStatus,
} from "@shared/observability/sentry-scrub";

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

export type ApiErrorDetails =
  | {
      issues?: ZodIssue[];
      [key: string]: unknown;
    }
  | ReadonlyArray<{
      code: string;
      message: string;
      path: string;
    }>;

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: ApiErrorDetails;
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
  // Facturación (contrato POST/PUT /invoices)
  trip_ids: "Viajes",
  billing_scope: "Tipo de factura",
  receiver_rfc: "RFC del receptor",
  receiver_name: "Nombre o razón social del receptor",
  receiver_tax_regime: "Régimen fiscal del receptor",
  receiver_postal_code: "Código postal del receptor",
  cfdi_usage: "Uso del CFDI",
  payment_form: "Forma de pago",
  payment_method: "Método de pago",
  currency: "Moneda",
  exchange_rate: "Tipo de cambio",
  subtotal: "Subtotal",
  discount: "Descuento",
  total_tax: "IVA",
  retained_tax: "IVA retenido",
  total: "Total",
  notes: "Notas",
  concepts: "Conceptos",
  concept_type: "Tipo de concepto",
  service_concept_id: "Servicio del catálogo",
  clave_prod_serv: "Clave de producto o servicio",
  clave_unidad: "Clave de unidad",
  unidad: "Unidad de medida",
  quantity: "Cantidad",
  unit_price: "Precio unitario",
  amount: "Importe",
  object_imp: "Objeto de impuesto",
  iva_rate: "Tasa de IVA",
  retained_iva_rate: "Tasa de retención de IVA",
  // Generales
  name: "Nombre",
  description: "Descripción",
  password: "Contraseña",
};

function normalizeIssuePath(path: unknown): string {
  if (typeof path === "string" && path.trim().length > 0) return path.trim();
  if (Array.isArray(path) && path.length > 0) {
    return path.map(String).join(".");
  }
  return "general";
}

function getFieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];

  if (field.endsWith(".driver.rfc") || field === "driver.rfc") {
    return "RFC del conductor";
  }
  if (
    field.endsWith(".driver.license_number") ||
    field === "driver.license_number"
  ) {
    return "Licencia del conductor";
  }
  if (field.endsWith(".driver.name") || field === "driver.name") {
    return "Nombre del conductor";
  }

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
  PAC_NOT_IMPLEMENTED: "El PAC configurado no está disponible. Ve a Configuración → Datos para facturar.",
  PAC_CONFIG_ERROR: "Error de configuración del PAC. Verifica las variables de entorno del servidor.",

  // ── Viajes ─────────────────────────────────────────────────────────────────
  TRIP_NOT_FOUND: "Viaje no encontrado",
  TRIP_CANNOT_BE_MODIFIED:
    "El viaje no puede ser modificado en su estado actual",
  INVALID_TRIP_STATUS_TRANSITION: "Transición de estado del viaje no permitida",
  TRIP_CODE_EXISTS: "El código de viaje ya existe",
  FISCAL_PRECONDITION_FAILED:
    "No se puede iniciar el viaje: falta cumplir la precondición fiscal (p. ej. factura timbrada). Revise la sección Fiscal o genere/timbre la factura del viaje.",
  RESOURCE_BUSY_ON_OTHER_TRIP:
    "El vehículo o conductor ya está asignado a otro viaje activo.",
  VEHICLE_NOT_AVAILABLE:
    "El vehículo no está disponible para iniciar o reservar el viaje.",
  DRIVER_NOT_AVAILABLE:
    "El conductor no está disponible para iniciar o reservar el viaje.",
  TRIP_NOT_SCHEDULED: "Solo se puede iniciar un viaje en estado programado.",
  V1_CARGO_PLACEHOLDER_CLIENT_MISSING:
    "No se pudo completar la mercancía del viaje. Intenta de nuevo o contacta a soporte.",

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
  EMAIL_EXISTS:
    "No se pudo completar el registro. Si ya tienes cuenta, inicia sesión.",
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

/** Mensajes de timbrado PAC traducidos a lenguaje operativo (sin códigos ni XSD). */
const PAC_USER_MESSAGES: Record<string, string> = {
  CP132:
    "No se pudo timbrar: el RFC de remitente o destinatario en una parada del viaje no está registrado ante el SAT. Revise en Viajes → Ruta todas las paradas (origen, escalas y destino) y use un RFC real y vigente del cliente o ubicación.",
  PAC_ISSUED_AT_OUT_OF_RANGE:
    "No se pudo timbrar: la fecha de emisión del borrador supera las 72 horas que permite el SAT. Vuelve a intentar el timbrado; el sistema actualiza la fecha automáticamente al timbrar.",
  CFDI40145:
    "La razón social del receptor no coincide con la registrada ante el SAT para ese RFC. Corrija el nombre en el cliente según la CSF, actualice los datos fiscales de la factura y vuelva a timbrar.",
  CFDI40147:
    "El código postal fiscal del receptor no coincide con el registrado ante el SAT para ese RFC. Corrija el CP en el cliente (dirección de facturación) según la CSF, actualice los datos fiscales de la factura y vuelva a timbrar.",
  CFDI40148:
    "El código postal fiscal del receptor no pertenece al domicilio registrado ante el SAT para ese RFC. Corrija el CP en el cliente (dirección de facturación) según la CSF, actualice los datos fiscales de la factura y vuelva a timbrar.",
  CFDI40158:
    "El régimen fiscal del receptor no corresponde al tipo de persona (física o moral) del RFC indicado.",
};

function normalizeApiErrorDetails(
  details?: ApiErrorDetails,
): Record<string, unknown> | undefined {
  if (!details) {
    return undefined;
  }
  if (Array.isArray(details)) {
    return { issues: [...details] };
  }
  return details as Record<string, unknown>;
}

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
    const details = data?.details;
    const validationErrors = extractValidationErrors(details);
    const message = getMessageForError(status, code, data, validationErrors);

    return new ApiError(
      message,
      status,
      code,
      normalizeApiErrorDetails(details),
      validationErrors,
    );
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

    const detailMessages = this.validationErrors
      .map((entry) => entry.message)
      .filter((message) => message.trim().length > 0);

    if (detailMessages.length === 1) {
      return detailMessages[0];
    }

    if (detailMessages.length > 1) {
      const first = detailMessages[0];
      return `${first} (+${detailMessages.length - 1} más)`;
    }

    const first = this.validationErrors[0];
    return `${first.label}: ${first.message}`;
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

function extractValidationErrors(details?: unknown): ValidationFieldError[] {
  if (!details) return [];

  if (Array.isArray(details)) {
    const fromZod = mapZodIssues(details);
    if (fromZod.length > 0) return fromZod;

    if (
      details.every(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          "message" in entry &&
          typeof (entry as { message: unknown }).message === "string",
      )
    ) {
      return details.map((entry) => {
        const item = entry as {
          message: string;
          path?: string | (string | number)[];
          code?: string;
        };
        const field = normalizeIssuePath(item.path);
        return {
          field,
          label: getFieldLabel(field),
          message: translateZodMessage(item.message),
        };
      });
    }

    return [];
  }

  if (typeof details !== "object") return [];

  const record = details as Record<string, unknown>;
  let issues: ZodIssue[] | undefined;

  // Caso 1: details.message es un string JSON (tu caso actual)
  if (typeof record.message === "string") {
    try {
      const parsed = JSON.parse(record.message);
      if (Array.isArray(parsed)) {
        issues = parsed as ZodIssue[];
      }
    } catch {
      // No es JSON válido, ignorar
    }
  }
  // Caso 2: details.message ya es un array
  else if (Array.isArray(record.message)) {
    issues = record.message as ZodIssue[];
  }
  // Caso 3: details.issues es un array
  else if (Array.isArray(record.issues)) {
    issues = record.issues as ZodIssue[];
  }

  return mapZodIssues(issues ?? []);
}

function mapZodIssues(issues: unknown[]): ValidationFieldError[] {
  if (issues.length === 0) return [];

  const first = issues[0];
  if (
    typeof first !== "object" ||
    first === null ||
    !("message" in first) ||
    !("path" in first)
  ) {
    return [];
  }

  return (issues as ZodIssue[]).map((issue) => {
    const field = normalizeIssuePath(issue.path);
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

function extractPacRawDescription(raw: unknown): string | null {
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as { description?: string };
      if (typeof parsed?.description === "string" && parsed.description.trim()) {
        return parsed.description.trim();
      }
    } catch {
      return raw.trim();
    }
    return raw.trim();
  }

  if (!raw || typeof raw !== "object") return null;

  const record = raw as { description?: string; detail?: string };
  if (typeof record.description === "string" && record.description.trim()) {
    return record.description.trim();
  }

  if (typeof record.detail === "string" && record.detail.trim()) {
    try {
      const items = JSON.parse(record.detail) as Array<{
        Key?: string;
        Value?: string;
      }>;
      const preferred =
        items.find((item) => item.Key === "message")?.Value ??
        items.find((item) => item.Key === "messageDetail")?.Value;
      if (preferred?.trim()) return preferred.trim();
    } catch {
      return record.detail.trim();
    }
  }

  return null;
}

function parseProFactDetailKv(detail: string): Record<string, string> {
  try {
    const items = JSON.parse(detail) as Array<{ Key?: string; Value?: string }>;
    if (!Array.isArray(items)) return {};
    return Object.fromEntries(
      items
        .filter((item) => typeof item.Key === "string")
        .map((item) => [item.Key!, String(item.Value ?? "")]),
    );
  } catch {
    return {};
  }
}

function buildCfdi40158OperationalMessage(
  detailJson?: string,
): string {
  const base = PAC_USER_MESSAGES.CFDI40158;
  if (!detailJson?.trim()) return base;

  const kv = parseProFactDetailKv(detailJson);
  const rfc = kv.rfcReceptor;
  const reported = kv.regimenFiscalReportado;
  const expected = kv.regimenFiscalEsperado?.replace(/,\s*$/, "");
  const isPersonaFisica = kv.esPersonaFisica === "True";

  if (!rfc && !reported) return base;

  const personaLabel = isPersonaFisica ? "persona física" : "persona moral";
  let message = `El régimen fiscal ${reported ?? "indicado"} no es válido para el RFC ${rfc ?? "del receptor"} (${personaLabel}).`;
  if (expected) {
    message += ` Régimenes permitidos: ${expected}.`;
  }
  message +=
    " Corrija el régimen fiscal en «Corregir datos fiscales» o use un RFC acorde al régimen actual.";
  return message;
}

/** Mensaje operativo cuando la API devuelve error ProFact crudo (p. ej. 502 INTERNAL_ERROR). */
function resolveProFactBodyMessage(errorBody: string): string | null {
  const match = errorBody.match(
    /ProFact\s+\S+\s+error\s+\[([^\]]+)\]:\s*(.+?)(?:\s*—\s*(.+))?$/s,
  );
  if (!match) return null;

  const [, ruleCode, description, detailPart] = match;
  const desc = description.trim();

  if (ruleCode === "CFDI40158" || desc.includes("RegimenFiscalR")) {
    return buildCfdi40158OperationalMessage(detailPart?.trim());
  }

  if (desc.toLowerCase().includes("72 horas")) {
    return PAC_USER_MESSAGES.PAC_ISSUED_AT_OUT_OF_RANGE;
  }

  if (desc) return desc;
  return null;
}

function resolvePacErrorMessage(
  code: string | undefined,
  details: unknown,
): string | null {
  const record =
    details && typeof details === "object" && !Array.isArray(details)
      ? (details as Record<string, unknown>)
      : null;

  const pacRule =
    typeof record?.pac_rule === "string" ? record.pac_rule : undefined;
  const hint = typeof record?.hint === "string" ? record.hint.trim() : "";
  const rawMessage = extractPacRawDescription(record?.raw);
  const isPacError = code?.startsWith("PAC_") || Boolean(pacRule);

  if (!isPacError) return null;

  if (pacRule === "CP132" || code === "PAC_CP132_UBICACION_RFC_INVALID") {
    return PAC_USER_MESSAGES.CP132;
  }

  if (code === "PAC_ISSUED_AT_OUT_OF_RANGE") {
    return PAC_USER_MESSAGES.PAC_ISSUED_AT_OUT_OF_RANGE;
  }

  if (pacRule === "CFDI40158") {
    const rawRecord =
      typeof record?.raw === "object" && record.raw !== null
        ? (record.raw as { detail?: string })
        : null;
    const detailRaw =
      typeof rawRecord?.detail === "string"
        ? rawRecord.detail
        : typeof record?.raw === "string"
          ? record.raw
          : undefined;
    const message = buildCfdi40158OperationalMessage(detailRaw);
    return hint && !message.includes(hint) ? `${message} ${hint}` : message;
  }

  if (pacRule && PAC_USER_MESSAGES[pacRule]) {
    const mapped = PAC_USER_MESSAGES[pacRule];
    return hint && !mapped.includes(hint) ? `${mapped} ${hint}` : mapped;
  }

  if (rawMessage) {
    return hint && !rawMessage.includes(hint)
      ? `${rawMessage} ${hint}`
      : rawMessage;
  }

  return hint || null;
}

function getMessageForError(
  status: number,
  code: string | undefined,
  data: ApiErrorResponse | undefined,
  validationErrors: ValidationFieldError[],
): string {
  if (code === "INVALID_RFC_AT_STOP") {
    const details =
      data?.details && typeof data.details === "object" && !Array.isArray(data.details)
        ? (data.details as Record<string, unknown>)
        : null;
    const stopOrder =
      typeof details?.stopOrder === "number" ? details.stopOrder : null;
    if (stopOrder != null) {
      return `RFC inválido en parada #${stopOrder}. Corrige el RFC antes de volver a timbrar.`;
    }
    return "RFC inválido en una parada del viaje. Corrige el RFC antes de volver a timbrar.";
  }

  const pacMessage = resolvePacErrorMessage(code, data?.details);
  if (pacMessage) return pacMessage;

  if (data?.error && typeof data.error === "string") {
    const profactMessage = resolveProFactBodyMessage(data.error);
    if (profactMessage) return profactMessage;
  }

  if (
    status === 502 &&
    typeof data?.error === "string" &&
    data.error.toLowerCase().includes("72 horas")
  ) {
    return PAC_USER_MESSAGES.PAC_ISSUED_AT_OUT_OF_RANGE;
  }

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

  // 4. Mensaje del backend como último recurso (5xx).
  //    No exponer jerga de migración/ops al operador.
  if (data?.error && typeof data.error === "string") {
    const raw = data.error;
    if (
      /migraci[oó]n\s+\d+/i.test(raw) ||
      /\b(ejecute|ejecutar)\b/i.test(raw) ||
      /\bplaceholder\b/i.test(raw)
    ) {
      return HTTP_STATUS_MESSAGES[status] || "Ocurrió un error inesperado.";
    }
    return raw;
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
      if (status === 401 || status === 403 || status === 402) {
        return Promise.reject(error);
      }

      if (shouldCaptureApiStatus(status)) {
        const apiError = ApiError.fromAxiosError(error);
        captureWebException(apiError, {
          apiPath: error.config?.url,
          errorCode: apiError.code,
        });
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
