/**
 * Trip Wizard Validation Schemas
 * Clean Architecture - Presentation Layer (Validation)
 *
 * Schemas Zod para el wizard de creación de viajes.
 * Incluye validaciones para Carta Porte 3.1.
 *
 * ACTUALIZADO: Campos de dirección unificados con Carta Porte
 * - Eliminados campos duplicados (address, city, state como texto libre)
 * - Todos los campos geográficos usan catálogos SAT
 * - Validaciones coherentes con requerimientos fiscales
 *
 * Ubicación: src/features/trips/presentation/pages/create/validation.ts
 */

import { z } from "zod";

// ============================================================================
// AUTOTRANSPORTE SCHEMA (Carta Porte 3.1)
// ============================================================================

/**
 * Schema para datos de Autotransporte Federal
 * Nodo: cfdi:Complemento > cartaporte31:CartaPorte > cartaporte31:Autotransporte
 */
export const autotransporteSchema = z.object({
  // ── Permiso SCT ─────────────────────────────────────────────────────────
  /**
   * Tipo de permiso SCT (c_TipoPermiso)
   * Ej: "TPAF01" = Carga general
   */
  tipoPermisoSct: z
    .string()
    .min(1, "El tipo de permiso SCT es requerido para Carta Porte"),

  /**
   * Número de permiso otorgado por SCT
   */
  numPermisoSct: z
    .string()
    .min(1, "El número de permiso SCT es requerido")
    .max(50, "El número de permiso es muy largo"),

  // ── Identificación Vehicular ────────────────────────────────────────────
  /**
   * Configuración vehicular SAT (c_ConfigAutotransporte)
   * Ej: "VL" = Vehículo ligero de carga (menores a 3.5 ton)
   * Ej: "C2" = Camión Unitario (2 ejes)
   * Ej: "T3S2R4" = Tractocamión doblemente articulado
   */
  configVehicular: z.string().min(1, "La configuración vehicular es requerida"),

  /**
   * Placa del vehículo motor
   */
  placaVm: z
    .string()
    .min(1, "La placa del vehículo es requerida")
    .max(20, "La placa es muy larga"),

  /**
   * Año modelo del vehículo
   */
  anioModelo: z.coerce
    .number()
    .min(1990, "Año modelo inválido")
    .max(new Date().getFullYear() + 1, "Año modelo inválido"),

  // ── Seguros ─────────────────────────────────────────────────────────────
  /**
   * Nombre de la aseguradora de responsabilidad civil
   * OBLIGATORIO para Carta Porte
   */
  aseguraRespCivil: z
    .string()
    .min(1, "La aseguradora de responsabilidad civil es requerida"),

  /**
   * Número de póliza de responsabilidad civil
   * OBLIGATORIO para Carta Porte
   */
  polizaRespCivil: z
    .string()
    .min(1, "El número de póliza de responsabilidad civil es requerido"),

  /**
   * Nombre de la aseguradora de carga
   * Requerido si se declara valor de mercancías
   */
  aseguraCarga: z.string().optional(),

  /**
   * Número de póliza de seguro de carga
   */
  polizaCarga: z.string().optional(),

  /**
   * Aseguradora de daños al medio ambiente
   * Solo para materiales peligrosos
   */
  aseguraMedAmbiente: z.string().optional(),

  /**
   * Póliza de daños al medio ambiente
   */
  polizaMedAmbiente: z.string().optional(),

  // ── Remolques (opcional) ────────────────────────────────────────────────
  /**
   * Array de remolques/semirremolques
   * Solo si la configuración vehicular los incluye
   */
  remolques: z
    .array(
      z.object({
        subTipoRem: z.string().min(1, "Subtipo de remolque requerido"), // c_SubTipoRem
        placa: z.string().min(1, "Placa del remolque requerida"),
      }),
    )
    .optional(),
});

// ============================================================================
// FIGURA DE TRANSPORTE SCHEMA (Carta Porte 3.1)
// ============================================================================

/**
 * Schema para la Figura de Transporte (Operador)
 * Nodo: cfdi:Complemento > cartaporte31:CartaPorte > cartaporte31:FiguraTransporte > cartaporte31:TiposFigura
 *
 * El nodo FiguraTransporte es OBLIGATORIO y debe incluir al menos un operador.
 * Cuando TipoFigura = "01" (Operador), se requieren campos adicionales como NumLicencia.
 */
export const figuraTransporteSchema = z.object({
  // ── Identificación de la Figura ────────────────────────────────────────
  /**
   * Tipo de figura de transporte (c_TipoFigura)
   * "01" = Operador (conductor) - Requiere NumLicencia
   * "02" = Propietario
   * "03" = Arrendador
   * "04" = Notificado
   */
  tipoFigura: z.string().min(1, "El tipo de figura es requerido"),

  /**
   * RFC de la figura de transporte
   * OBLIGATORIO para operadores nacionales
   */
  rfcFigura: z
    .string()
    .min(12, "RFC inválido")
    .max(13, "RFC inválido")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido")
    .optional()
    .or(z.literal("")),

  /**
   * Número de licencia del operador
   * OBLIGATORIO cuando TipoFigura = "01" (Operador)
   */
  numLicencia: z
    .string()
    .min(1, "El número de licencia es requerido para el operador")
    .max(16, "Número de licencia muy largo"),

  /**
   * Nombre completo del operador
   * OBLIGATORIO
   */
  nombreFigura: z
    .string()
    .min(1, "El nombre del operador es requerido")
    .max(254, "Nombre muy largo"),

  /**
   * CURP del operador
   * Útil para validaciones adicionales
   */
  curp: z
    .string()
    .length(18, "CURP debe tener 18 caracteres")
    .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, "Formato de CURP inválido")
    .optional()
    .or(z.literal("")),

  // ── Datos para Transporte Internacional ────────────────────────────────
  /**
   * País de residencia fiscal del operador
   * Código ISO 3166-1 alpha-3 (ej: "MEX", "USA")
   * Solo requerido para transporte internacional
   */
  residenciaFiscalFigura: z
    .string()
    .length(3, "Código de país debe ser de 3 caracteres")
    .optional()
    .or(z.literal("")),

  /**
   * Número de identificación tributaria extranjero
   * Solo cuando el operador es extranjero
   */
  numRegIdTribFigura: z
    .string()
    .max(40, "ID tributario muy largo")
    .optional()
    .or(z.literal("")),
});

// ============================================================================
// STOP SCHEMA (Carta Porte 3.1 - Campos Unificados)
// ============================================================================

/**
 * Schema para una parada del viaje
 *
 * IMPORTANTE: Los campos de dirección están unificados con los requerimientos
 * de Carta Porte 3.1. NO hay campos duplicados.
 *
 * Campos geográficos SAT obligatorios:
 * - satEstadoCode (c_Estado)
 * - satMunicipioCode (c_Municipio)
 * - postalCode (c_CodigoPostal)
 *
 * Campos geográficos SAT opcionales:
 * - satLocalidadCode (c_Localidad)
 * - satColoniaCode (c_Colonia)
 */
export const tripStopSchema = z.object({
  id: z.string().optional(),
  sequenceOrder: z.number().min(0),
  stopType: z
    .array(z.enum(["origin", "pickup", "delivery", "waypoint", "destination"]))
    .min(1, "Debe seleccionar al menos un tipo de parada"),

  // ── Asociación con cliente (opcional) ───────────────────────────────────
  clientId: z.string().optional(),
  clientAddressId: z.string().optional(),

  // ── Identificación del lugar ────────────────────────────────────────────
  locationName: z.string().optional(), // Nombre del lugar (ej: "Bodega Central")

  // ── Ubicación SAT (Carta Porte 3.1) ─────────────────────────────────────
  /**
   * Código de Estado SAT (c_Estado)
   * OBLIGATORIO para Carta Porte
   */
  satEstadoCode: z
    .string()
    .min(1, "El estado es requerido")
    .max(3, "Código de estado inválido"),

  /**
   * Código de Municipio SAT (c_Municipio)
   * OBLIGATORIO para Carta Porte
   * Formato: código estado + código municipio (ej: "001" para Aguascalientes)
   */
  satMunicipioCode: z
    .string()
    .min(1, "El municipio es requerido")
    .max(5, "Código de municipio inválido"),

  /**
   * Código Postal (c_CodigoPostal)
   * OBLIGATORIO para Carta Porte
   * 5 dígitos
   */
  postalCode: z
    .string()
    .min(5, "Código postal debe tener 5 dígitos")
    .max(5, "Código postal debe tener 5 dígitos")
    .regex(/^\d{5}$/, "Código postal inválido"),

  /**
   * Código de Localidad SAT (c_Localidad)
   * OPCIONAL - Usado principalmente en zonas rurales
   */
  satLocalidadCode: z.string().optional(),

  /**
   * Código de Colonia SAT (c_Colonia)
   * OPCIONAL - Ayuda a precisar la ubicación
   */
  satColoniaCode: z.string().optional(),

  // ── Dirección desglosada ────────────────────────────────────────────────
  /**
   * Calle
   */
  street: z.string().max(100, "Calle muy larga").optional(),

  /**
   * Número exterior
   */
  exteriorNumber: z.string().max(20, "Número exterior muy largo").optional(),

  /**
   * Número interior
   */
  interiorNumber: z.string().max(20, "Número interior muy largo").optional(),

  /**
   * Referencia (entre calles, cerca de...)
   */
  reference: z.string().max(250, "Referencia muy larga").optional(),

  // ── Coordenadas (opcional, para mapas) ──────────────────────────────────
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // ── Remitente / Destinatario ────────────────────────────────────────────
  /**
   * RFC del remitente (origen) o destinatario (destino)
   */
  rfcRemitenteDestinatario: z
    .string()
    .max(13, "RFC inválido")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido")
    .optional()
    .or(z.literal("")),

  /**
   * Nombre o razón social del remitente/destinatario
   */
  nombreRemitenteDestinatario: z
    .string()
    .max(254, "Nombre muy largo")
    .optional(),

  // ── Contacto en sitio ───────────────────────────────────────────────────
  contactName: z.string().max(100, "Nombre muy largo").optional(),
  contactPhone: z.string().max(20, "Teléfono muy largo").optional(),

  // ── Tiempos ─────────────────────────────────────────────────────────────
  estimatedArrival: z.string().optional(), // ISO 8601

  // ── Notas ───────────────────────────────────────────────────────────────
  notes: z.string().max(500, "Notas muy largas").optional(),

  // ── Distancia (Carta Porte) ─────────────────────────────────────────────
  /**
   * Distancia en kilómetros desde la parada anterior
   * OBLIGATORIO para Carta Porte (excepto en origen)
   */
  distanceToNextKm: z.coerce
    .number()
    .min(0, "La distancia no puede ser negativa")
    .optional(),
});

// ============================================================================
// CARGO MOVEMENT SCHEMA
// ============================================================================

export const cargoMovementSchema = z.object({
  stopIndex: z.number().min(0, "Parada requerida"),
  movementType: z.enum(["pickup", "delivery"]),
  weight: z.coerce.number().min(0).optional(),
  units: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CARGO SCHEMA
// ============================================================================

/**
 * Schema para una mercancía del viaje
 */
export const tripCargoSchema = z.object({
  id: z.string().optional(),

  // Descripción
  description: z.string().min(1, "Descripción requerida"),

  // Cantidades
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
  weight: z.coerce.number().min(0, "El peso no puede ser negativo").optional(),
  declaredValue: z.coerce
    .number()
    .min(0, "El valor no puede ser negativo")
    .optional(),

  // Catálogos SAT para Carta Porte
  satClaveProductoServicio: z.string().optional(), // c_ClaveProdServCP
  satClaveUnidad: z.string().optional(), // c_ClaveUnidad

  // Material peligroso
  isMaterialPeligroso: z.boolean().default(false),
  satClaveMaterialPeligroso: z.string().optional(), // c_MaterialPeligroso
  satTipoEmbalaje: z.string().optional(), // c_TipoEmbalaje

  // Movimientos en paradas
  movements: z.array(cargoMovementSchema).optional(),

  // Notas
  notes: z.string().optional(),
});

// ============================================================================
// EXPENSE SCHEMA
// ============================================================================

export const tripExpenseSchema = z.object({
  id: z.string().optional(),
  category: z.enum([
    "fuel",
    "tolls",
    "driver_allowance",
    "lodging",
    "loading_unloading",
    "parking",
    "maintenance",
    "insurance",
    "permits",
    "other",
  ]),
  description: z.string().min(1, "Descripción requerida"),
  estimatedAmount: z.coerce.number().min(0, "El monto no puede ser negativo"),
  notes: z.string().optional(),
});

// ============================================================================
// FULL WIZARD SCHEMA
// ============================================================================

export const tripWizardSchema = z.object({
  // Paso 1: Información Básica
  vehicleId: z.string().min(1, "Vehículo requerido"),
  driverId: z.string().min(1, "Conductor requerido"),
  clientId: z.string().optional(),
  scheduledDeparture: z.string().min(1, "Fecha de salida requerida"),
  scheduledArrival: z.string().optional(),
  startMileage: z.coerce.number().min(0).optional(),
  vehicleCurrentMileage: z.coerce.number().min(0).optional(),

  // Carta Porte - Autotransporte
  autotransporte: autotransporteSchema,

  // Carta Porte - Figura de Transporte (Operador)
  figuraTransporte: figuraTransporteSchema,

  // Transporte Internacional
  transpInternac: z.boolean().default(false),
  entradaSalidaMerc: z.enum(["Entrada", "Salida"]).optional(),
  paisOrigenDestino: z.string().optional(), // c_Pais

  // Paso 2: Ruta
  stops: z.array(tripStopSchema).min(2, "Se requieren al menos 2 paradas"),

  // Paso 3: Carga
  cargos: z.array(tripCargoSchema),

  // Paso 4: Costos
  expenses: z.array(tripExpenseSchema),
  baseRate: z.coerce.number().min(0).optional(),

  // Paso 5: Notas
  notes: z.string().optional(),
});

// ============================================================================
// TYPES INFERRED FROM SCHEMAS
// ============================================================================

export type AutotransporteFormValues = z.infer<typeof autotransporteSchema>;
export type FiguraTransporteFormValues = z.infer<typeof figuraTransporteSchema>;
export type TripStopFormValues = z.infer<typeof tripStopSchema>;
export type CargoMovementFormValues = z.infer<typeof cargoMovementSchema>;
export type TripCargoFormValues = z.infer<typeof tripCargoSchema>;
export type TripExpenseFormValues = z.infer<typeof tripExpenseSchema>;
export type TripWizardFormValues = z.infer<typeof tripWizardSchema>;

// ============================================================================
// WIZARD STEPS CONFIGURATION
// ============================================================================

export const WIZARD_STEPS = [
  {
    id: "basic",
    title: "Información",
    description: "Asignaciones, autotransporte y operador",
    fields: [
      "vehicleId",
      "driverId",
      "clientId",
      "scheduledDeparture",
      "scheduledArrival",
      "startMileage",
      "autotransporte",
      "figuraTransporte",
      "transpInternac",
    ],
  },
  {
    id: "route",
    title: "Ruta",
    description: "Paradas del viaje",
    fields: ["stops"],
  },
  {
    id: "cargo",
    title: "Cargas",
    description: "Mercancías a transportar",
    fields: ["cargos"],
  },
  {
    id: "costs",
    title: "Costos",
    description: "Gastos estimados",
    fields: ["expenses", "baseRate"],
  },
  {
    id: "summary",
    title: "Resumen",
    description: "Confirmar y crear",
    fields: ["notes"],
  },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const defaultWizardFormValues: Partial<TripWizardFormValues> = {
  vehicleId: "",
  driverId: "",
  clientId: "",
  scheduledDeparture: "",
  scheduledArrival: "",
  startMileage: undefined,
  vehicleCurrentMileage: undefined,
  autotransporte: {
    tipoPermisoSct: "",
    numPermisoSct: "",
    configVehicular: "",
    placaVm: "",
    anioModelo: new Date().getFullYear(),
    aseguraRespCivil: "",
    polizaRespCivil: "",
    aseguraCarga: "",
    polizaCarga: "",
    remolques: [],
  },
  figuraTransporte: {
    tipoFigura: "01", // Default: Operador
    rfcFigura: "",
    numLicencia: "",
    nombreFigura: "",
    curp: "",
    residenciaFiscalFigura: "",
    numRegIdTribFigura: "",
  },
  transpInternac: false,
  stops: [],
  cargos: [],
  expenses: [],
  baseRate: undefined,
  notes: "",
};

// ============================================================================
// DEFAULT STOP VALUES
// ============================================================================

export const defaultStopFormValues: Partial<TripStopFormValues> = {
  stopType: [],
  clientId: "",
  clientAddressId: "",
  locationName: "",
  satEstadoCode: "",
  satMunicipioCode: "",
  postalCode: "",
  satLocalidadCode: "",
  satColoniaCode: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  reference: "",
  rfcRemitenteDestinatario: "",
  nombreRemitenteDestinatario: "",
  contactName: "",
  contactPhone: "",
  notes: "",
  distanceToNextKm: undefined,
};

// ============================================================================
// ROUTE STEP VALIDATION HELPER
// ============================================================================

export interface RouteStepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida el paso de Ruta para mostrar mensajes específicos
 */
export function validateRouteStep(
  stops: TripStopFormValues[],
): RouteStepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const originStops = stops.filter((stop) => stop.stopType.includes("origin"));
  const destinationStops = stops.filter((stop) =>
    stop.stopType.includes("destination"),
  );
  const waypointStops = stops.filter(
    (stop) =>
      stop.stopType.includes("waypoint") &&
      !stop.stopType.includes("origin") &&
      !stop.stopType.includes("destination"),
  );

  // Validar origen
  if (originStops.length === 0) {
    errors.push("Falta agregar la parada de origen");
  } else if (originStops.length > 1) {
    errors.push("Solo puede existir una parada de origen");
  }

  // Validar destino
  if (destinationStops.length === 0) {
    errors.push("Falta agregar la parada de destino");
  } else if (destinationStops.length > 1) {
    errors.push("Solo puede existir una parada de destino");
  }

  // Validar que origen tenga pickup
  if (originStops.length === 1) {
    const origin = originStops[0];
    if (!origin.stopType.includes("pickup")) {
      errors.push("La parada de origen debe tener operación de carga");
    }
  }

  // Validar que destino tenga delivery
  if (destinationStops.length === 1) {
    const destination = destinationStops[0];
    if (!destination.stopType.includes("delivery")) {
      errors.push("La parada de destino debe tener operación de descarga");
    }
  }

  // Validar escalas
  for (let i = 0; i < waypointStops.length; i++) {
    const waypoint = waypointStops[i];
    const hasOperation =
      waypoint.stopType.includes("pickup") ||
      waypoint.stopType.includes("delivery");

    if (!hasOperation) {
      const label = waypoint.locationName || `Escala ${i + 1}`;
      errors.push(`La escala "${label}" no tiene operación asignada`);
    }
  }

  // Validar campos Carta Porte en cada parada
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const label = stop.locationName || `Parada ${i + 1}`;

    if (!stop.satEstadoCode) {
      errors.push(`"${label}" no tiene estado SAT`);
    }
    if (!stop.satMunicipioCode) {
      errors.push(`"${label}" no tiene municipio SAT`);
    }
    if (!stop.postalCode) {
      errors.push(`"${label}" no tiene código postal`);
    }

    // Distancia obligatoria excepto en origen
    if (i > 0 && !stop.distanceToNextKm && stop.distanceToNextKm !== 0) {
      warnings.push(`"${label}" no tiene distancia desde la parada anterior`);
    }
  }

  // Advertencias
  if (waypointStops.length === 0 && errors.length === 0) {
    warnings.push(
      "El viaje no tiene escalas intermedias. Esto es válido pero puede agregar escalas si necesita paradas adicionales.",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// BASIC INFO STEP VALIDATION HELPER
// ============================================================================

export interface BasicInfoStepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida el paso de Información Básica
 */
export function validateBasicInfoStep(
  data: Partial<TripWizardFormValues>,
): BasicInfoStepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validaciones básicas
  if (!data.vehicleId) {
    errors.push("Debe seleccionar un vehículo");
  }

  if (!data.driverId) {
    errors.push("Debe seleccionar un conductor");
  }

  if (!data.scheduledDeparture) {
    errors.push("La fecha de salida programada es requerida");
  }

  // Validaciones de Autotransporte
  if (data.autotransporte) {
    const auto = data.autotransporte;

    if (!auto.tipoPermisoSct) {
      errors.push("El tipo de permiso SCT es requerido para Carta Porte");
    }

    if (!auto.numPermisoSct) {
      errors.push("El número de permiso SCT es requerido");
    }

    if (!auto.configVehicular) {
      errors.push("La configuración vehicular es requerida");
    }

    if (!auto.aseguraRespCivil || !auto.polizaRespCivil) {
      errors.push("El seguro de responsabilidad civil es obligatorio");
    }

    // Advertencias
    if (!auto.aseguraCarga) {
      warnings.push(
        "No ha ingresado seguro de carga. Será requerido si declara valor de mercancías.",
      );
    }
  } else {
    errors.push(
      "Los datos de Autotransporte Federal son requeridos para Carta Porte",
    );
  }

  // Validaciones de Figura de Transporte (Operador)
  if (data.figuraTransporte) {
    const figura = data.figuraTransporte;

    if (!figura.tipoFigura) {
      errors.push("El tipo de figura de transporte es requerido");
    }

    if (!figura.numLicencia) {
      errors.push("El número de licencia del operador es requerido");
    }

    if (!figura.nombreFigura) {
      errors.push("El nombre del operador es requerido");
    }

    // RFC es importante pero puede obtenerse del empleado
    if (!figura.rfcFigura) {
      warnings.push(
        "No se ha ingresado el RFC del operador. Verifique que los datos del empleado estén completos.",
      );
    }

    // Validaciones para transporte internacional
    if (data.transpInternac) {
      if (!figura.residenciaFiscalFigura) {
        warnings.push(
          "Para transporte internacional se recomienda ingresar el país de residencia fiscal del operador.",
        );
      }
    }
  } else {
    errors.push(
      "Los datos de la Figura de Transporte (Operador) son requeridos para Carta Porte",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
