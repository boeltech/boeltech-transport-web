/**
 * Trip Wizard Validation Schemas
 * Clean Architecture - Presentation Layer (Validation)
 *
 * Schemas Zod para el wizard de creación de viajes.
 * Incluye validaciones para Carta Porte 3.1.
 *
 * ACTUALIZADO: Campos de Autotransporte Federal
 * - Permiso SCT (tipo y número)
 * - Configuración Vehicular SAT
 * - Datos del vehículo
 * - Seguros obligatorios
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
// STOP SCHEMA
// ============================================================================

/**
 * Schema para una parada del viaje
 */
export const tripStopSchema = z.object({
  id: z.string().optional(),
  sequenceOrder: z.number().min(0),
  stopType: z
    .array(z.enum(["origin", "pickup", "delivery", "waypoint", "destination"]))
    .min(1, "Debe seleccionar al menos un tipo de parada"),

  // Asociación con cliente y dirección
  clientId: z.string().optional(),
  clientAddressId: z.string().optional(),

  // Dirección simplificada
  address: z.string().min(1, "Dirección requerida"),
  city: z.string().min(1, "Ciudad requerida"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  estimatedArrival: z.string().optional(),
  notes: z.string().optional(),

  // ── Carta Porte 3.1 — Domicilio desglosado ────────────────────
  street: z.string().optional(),
  exteriorNumber: z.string().optional(),
  interiorNumber: z.string().optional(),
  colonia: z.string().optional(),
  reference: z.string().optional(),

  // Claves SAT (catálogos oficiales)
  satEstadoCode: z.string().optional(), // c_Estado
  satMunicipioCode: z.string().optional(), // c_Municipio
  satLocalidadCode: z.string().optional(), // c_Localidad
  satColoniaCode: z.string().optional(), // c_Colonia

  // Remitente / Destinatario
  rfcRemitenteDestinatario: z.string().optional(),
  nombreRemitenteDestinatario: z.string().optional(),

  // Distancia
  distanceToNextKm: z.coerce.number().min(0).optional(),
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

export const tripCargoSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Cliente requerido"),
  description: z.string().min(1, "Descripción requerida"),
  productType: z.string().optional(),
  weight: z.coerce.number().min(0).optional(),
  volume: z.coerce.number().min(0).optional(),
  units: z.coerce.number().min(0).optional(),
  declaredValue: z.coerce.number().min(0).optional(),
  rate: z.coerce.number().min(0, "Tarifa requerida"),
  currency: z.string().default("MXN"),
  movements: z
    .array(cargoMovementSchema)
    .min(1, "Debe asignar al menos un punto de carga"),
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),

  // ── Carta Porte 3.1 — Mercancía ──────────────────────────────
  satProductCode: z.string().optional(), // c_ClaveProdServCP
  satProductDescription: z.string().optional(),
  satUnitCode: z.string().optional(), // c_ClaveUnidad
  satUnitName: z.string().optional(),
  weightInKg: z.coerce.number().min(0).optional(),
  dimensions: z.string().optional(),

  // Material peligroso
  hazardousMaterial: z.boolean().optional(),
  hazardousMaterialCode: z.string().optional(), // c_MaterialPeligroso
  packagingType: z.string().optional(), // c_TipoEmbalaje
  packagingDescription: z.string().optional(),
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
  amount: z.coerce.number().min(0, "Monto requerido"),
  currency: z.string().default("MXN"),
  expenseDate: z.string().optional(),
  location: z.string().optional(),
  vendorName: z.string().optional(),
  notes: z.string().optional(),
  isEstimated: z.boolean().default(true),
});

// ============================================================================
// MAIN WIZARD SCHEMA
// ============================================================================

export const tripWizardFormSchema = z
  .object({
    // ══════════════════════════════════════════════════════════════════════
    // Paso 1: Información Básica y Autotransporte
    // ══════════════════════════════════════════════════════════════════════

    // Asignaciones
    vehicleId: z.string().min(1, "Seleccione un vehículo"),
    driverId: z.string().min(1, "Seleccione un conductor"),
    clientId: z.string().optional(),

    // Programación
    scheduledDeparture: z.string().min(1, "Fecha de salida requerida"),
    scheduledArrival: z.string().optional(),
    startMileage: z.coerce.number().min(0).optional(),
    vehicleCurrentMileage: z.number().optional(),

    // Carta Porte — Autotransporte Federal
    autotransporte: autotransporteSchema.optional(),

    // Carta Porte — Figura de Transporte (Operador)
    figuraTransporte: figuraTransporteSchema.optional(),

    // Carta Porte — Ámbito
    transpInternac: z.boolean().default(false),

    // ══════════════════════════════════════════════════════════════════════
    // Paso 2: Ruta
    // ══════════════════════════════════════════════════════════════════════
    stops: z.array(tripStopSchema).default([]),

    // ══════════════════════════════════════════════════════════════════════
    // Paso 3: Cargas
    // ══════════════════════════════════════════════════════════════════════
    cargos: z.array(tripCargoSchema).default([]),

    // ══════════════════════════════════════════════════════════════════════
    // Paso 4: Costos
    // ══════════════════════════════════════════════════════════════════════
    expenses: z.array(tripExpenseSchema).default([]),
    baseRate: z.coerce.number().min(0).optional(),

    // ══════════════════════════════════════════════════════════════════════
    // Paso 5: Resumen / Notas
    // ══════════════════════════════════════════════════════════════════════
    notes: z.string().max(1000).optional(),

    // Legacy — se calculan desde stops
    originAddress: z.string().optional(),
    originCity: z.string().optional(),
    originState: z.string().optional(),
    destinationAddress: z.string().optional(),
    destinationCity: z.string().optional(),
    destinationState: z.string().optional(),
  })

  // ════════════════════════════════════════════════════════════════════════
  // REFINEMENTS
  // ════════════════════════════════════════════════════════════════════════

  // Fecha de llegada posterior a salida
  .refine(
    (data) => {
      if (data.scheduledArrival && data.scheduledDeparture) {
        return (
          new Date(data.scheduledArrival) > new Date(data.scheduledDeparture)
        );
      }
      return true;
    },
    {
      message: "La fecha de llegada debe ser posterior a la de salida",
      path: ["scheduledArrival"],
    },
  )

  // Kilometraje inicial >= kilometraje actual del vehículo
  .refine(
    (data) => {
      if (
        data.startMileage !== undefined &&
        data.vehicleCurrentMileage !== undefined
      ) {
        return data.startMileage >= data.vehicleCurrentMileage;
      }
      return true;
    },
    {
      message:
        "El kilometraje inicial no puede ser menor al kilometraje actual del vehículo",
      path: ["startMileage"],
    },
  )

  // Debe existir exactamente 1 parada de ORIGEN
  .refine(
    (data) => {
      if (data.stops.length === 0) return true;
      const originStops = data.stops.filter((stop) =>
        stop.stopType.includes("origin"),
      );
      return originStops.length === 1;
    },
    {
      message: "Debe existir exactamente una parada de origen",
      path: ["stops"],
    },
  )

  // Debe existir exactamente 1 parada de DESTINO
  .refine(
    (data) => {
      if (data.stops.length === 0) return true;
      const destinationStops = data.stops.filter((stop) =>
        stop.stopType.includes("destination"),
      );
      return destinationStops.length === 1;
    },
    {
      message: "Debe existir exactamente una parada de destino",
      path: ["stops"],
    },
  )

  // El origen debe tener operación de carga (pickup)
  .refine(
    (data) => {
      if (data.stops.length === 0) return true;
      const originStop = data.stops.find((stop) =>
        stop.stopType.includes("origin"),
      );
      if (!originStop) return true;
      return originStop.stopType.includes("pickup");
    },
    {
      message: "La parada de origen debe incluir operación de carga",
      path: ["stops"],
    },
  )

  // El destino debe tener operación de descarga (delivery)
  .refine(
    (data) => {
      if (data.stops.length === 0) return true;
      const destinationStop = data.stops.find((stop) =>
        stop.stopType.includes("destination"),
      );
      if (!destinationStop) return true;
      return destinationStop.stopType.includes("delivery");
    },
    {
      message: "La parada de destino debe incluir operación de descarga",
      path: ["stops"],
    },
  )

  // Las escalas deben tener al menos una operación
  .refine(
    (data) => {
      if (data.stops.length === 0) return true;
      const waypoints = data.stops.filter(
        (stop) =>
          stop.stopType.includes("waypoint") &&
          !stop.stopType.includes("origin") &&
          !stop.stopType.includes("destination"),
      );
      return waypoints.every(
        (stop) =>
          stop.stopType.includes("pickup") ||
          stop.stopType.includes("delivery"),
      );
    },
    {
      message:
        "Las escalas intermedias deben tener al menos una operación (carga o descarga)",
      path: ["stops"],
    },
  )

  // Si hay cargas con valor > 0, debe haber seguro de carga
  .refine(
    (data) => {
      const hasDeclaredValue = data.cargos.some(
        (c) => c.declaredValue && c.declaredValue > 0,
      );
      if (hasDeclaredValue && data.autotransporte) {
        return (
          !!data.autotransporte.aseguraCarga &&
          !!data.autotransporte.polizaCarga
        );
      }
      return true;
    },
    {
      message:
        "Se requiere seguro de carga cuando las mercancías tienen valor declarado",
      path: ["autotransporte", "aseguraCarga"],
    },
  );

// ============================================================================
// TYPES
// ============================================================================

export type TripWizardFormValues = z.infer<typeof tripWizardFormSchema>;
export type AutotransporteFormValues = z.infer<typeof autotransporteSchema>;
export type FiguraTransporteFormValues = z.infer<typeof figuraTransporteSchema>;
export type TripStopFormValues = z.infer<typeof tripStopSchema>;
export type TripCargoFormValues = z.infer<typeof tripCargoSchema>;
export type CargoMovementFormValues = z.infer<typeof cargoMovementSchema>;
export type TripExpenseFormValues = z.infer<typeof tripExpenseSchema>;

// ============================================================================
// WIZARD STEPS DEFINITION
// ============================================================================

export interface WizardStepDefinition {
  id: string;
  title: string;
  description: string;
  fields: (keyof TripWizardFormValues)[];
}

export const WIZARD_STEPS: WizardStepDefinition[] = [
  {
    id: "basic-info",
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
      const label =
        waypoint.locationName || waypoint.address || `Escala ${i + 1}`;
      errors.push(`La escala "${label}" no tiene operación asignada`);
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
