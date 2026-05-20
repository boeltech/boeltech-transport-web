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

import { isUnifiedAddressId } from "@features/trips/domain";
import { LOCATION_CAPTURE_LABELS } from "./wizardCopy";
import {
  getMissingSectorRequiredFields,
  isHazmatRequired,
  sectorFieldLabels,
} from "./cargoRegulatory";

/** Parada vinculada a fila `addresses` (Fase 4) — el backend puede omitir captura manual SAT. */
export function stopHasUnifiedAddressId(stop: { addressId?: string }): boolean {
  return isUnifiedAddressId(stop.addressId);
}

// ============================================================================
// STOP SCHEMA (Carta Porte 3.1 - Campos Unificados)
// ============================================================================

/**
 * Schema para una parada del viaje
 *
 * IMPORTANTE: Los campos de dirección están unificados con los requerimientos
 * de Carta Porte 3.1. NO hay campos duplicados.
 *
 * Campos geográficos SAT obligatorios **solo si no hay `addressId`** (dirección nueva):
 * - satStateCode (c_Estado)
 * - satMunicipalityCode (c_Municipio)
 * - postalCode (c_CodigoPostal)
 *
 * En el complemento Carta Porte 3.1, municipio/localidad/colonia en domicilio son
 * opcionales si no se envían; el wizard sigue pidiendo estado/municipio/CP para
 * coherencia operativa y catálogos.
 *
 * Opcionales en esquema SAT (recomendables para precisión):
 * - satLocalityCode (c_Localidad)
 * - satNeighborhoodCode (c_Colonia)
 */
export const tripStopSchema = z
  .object({
  id: z.string().optional(),
  sequenceOrder: z.number().min(0),
  stopType: z
    .array(z.enum(["origin", "pickup", "delivery", "waypoint", "destination"]))
    .min(1, "Debe seleccionar al menos un tipo de parada"),

  // ── Asociación con cliente (opcional) ───────────────────────────────────
  clientId: z.string().optional().or(z.literal("")),
  clientAddressId: z.string().optional(),
  /** FK → `addresses` cuando la parada reutiliza un domicilio guardado (Fase 4). */
  addressId: z.union([z.literal(""), z.string().uuid()]).optional(),

  // ── Identificación del lugar ────────────────────────────────────────────
  locationName: z.string().optional(), // Nombre del lugar (ej: "Bodega Central")

  // ── Ubicación SAT (Carta Porte 3.1) ─────────────────────────────────────
  /**
   * Código de Estado SAT (c_Estado)
   * Obligatorio si no hay `addressId`.
   */
  satCountryCode: z.string().length(3, "Código de país inválido").optional().or(z.literal("")),
  satStateCode: z.string().max(3, "Código de estado inválido").optional().or(z.literal("")),

  /**
   * Código de Municipio SAT (c_Municipio)
   * Obligatorio si no hay `addressId`.
   */
  satMunicipalityCode: z
    .string()
    .max(5, "Código de municipio inválido")
    .optional()
    .or(z.literal("")),

  /**
   * Código Postal (c_CodigoPostal)
   * Obligatorio si no hay `addressId` (5 dígitos).
   */
  postalCode: z
    .string()
    .max(5, "Código postal debe tener 5 dígitos")
    .optional()
    .or(z.literal("")),

  /**
   * Código de Localidad SAT (c_Localidad)
   * OPCIONAL - Usado principalmente en zonas rurales
   */
  satLocalityCode: z.string().optional(),

  /**
   * Nombre del municipio (texto del catálogo SAT).
   * Alimenta `originCity` / `destinationCity` del viaje y `city` en la parada.
   */
  cityName: z.string().max(200).optional(),

  /**
   * Código de Colonia SAT (c_Colonia)
   * OPCIONAL - Ayuda a precisar la ubicación
   */
  satNeighborhoodCode: z.string().optional(),

  /**
   * Nombre/descripción de la colonia (texto del catálogo SAT)
   * Se envía al backend como campo `colonia` en la parada
   */
  neighborhoodName: z.string().max(200, "Nombre de colonia muy largo").optional(),

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

  /**
   * Destinatario fiscal cuando la escala tiene carga y descarga en el mismo punto.
   * El campo principal sigue representando al remitente (carga).
   */
  deliveryRfcRemitenteDestinatario: z
    .string()
    .max(13, "RFC inválido")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido")
    .optional()
    .or(z.literal("")),

  deliveryNombreRemitenteDestinatario: z
    .string()
    .max(254, "Nombre muy largo")
    .optional(),

  /** Catálogo partners — contraparte remitente (carga / origen). */
  remitentePartnerId: z.union([z.string().uuid(), z.literal("")]).optional(),
  /** Catálogo partners — contraparte destinatario (descarga / segundo rol en escala mixta). */
  destinatarioPartnerId: z.union([z.string().uuid(), z.literal("")]).optional(),

  // ── Contacto en sitio ───────────────────────────────────────────────────
  contactName: z.string().max(100, "Nombre muy largo").optional(),
  contactPhone: z.string().max(20, "Teléfono muy largo").optional(),

  // ── Tiempos ─────────────────────────────────────────────────────────────
  estimatedArrival: z.string().optional(), // ISO 8601

  // ── Notas ───────────────────────────────────────────────────────────────
  notes: z.string().max(500, "Notas muy largas").optional(),

  // ── Distancia (Carta Porte) ─────────────────────────────────────────────
  /**
   * Distancia en kilómetros desde la parada anterior (excepto origen).
   * Puede dejarse vacía al capturar paradas fuera de orden; debe completarse antes de avanzar del paso Ruta y al enviar el viaje.
   */
  distanceFromPreviousKm: z.coerce
    .number()
    .min(0, "La distancia no puede ser negativa")
    .optional(),
  distanceSource: z
    .enum(["manual", "mapbox_matrix", "haversine_fallback"])
    .optional(),
  distanceProvider: z.enum(["mapbox", "stub"]).optional(),
  distanceConfidence: z.enum(["high", "medium", "low"]).optional(),
  distanceComputedAt: z.string().optional(),
})
  .superRefine((val, ctx) => {
    if (!stopHasUnifiedAddressId(val)) {
      const country = val.satCountryCode?.trim();
      if (!country) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Selecciona el ${LOCATION_CAPTURE_LABELS.country} de esta parada`,
          path: ["satCountryCode"],
        });
      }
      const estado = val.satStateCode?.trim();
      if (!estado) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Selecciona el ${LOCATION_CAPTURE_LABELS.state} de esta parada`,
          path: ["satStateCode"],
        });
      }
      const cp = val.postalCode?.trim() ?? "";
      if (!/^\d{5}$/.test(cp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Captura un ${LOCATION_CAPTURE_LABELS.postalCode} válido de 5 dígitos`,
          path: ["postalCode"],
        });
      }
    }

    if (val.latitude == null || val.longitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Confirma latitud y longitud en el mapa para esta parada",
        path: ["latitude"],
      });
    }
    /** Distancia entre paradas: opcional al guardar la parada; se cierra antes de salir del paso Ruta o al enviar el viaje. */
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
 * Alineado con los campos que usa CargoStep y con Carta Porte 3.1
 */
export const tripCargoSchema = z.object({
  id: z.string().optional(),

  // Cliente asociado
  clientId: z.string().optional(),

  // Clasificación SAT (Carta Porte 3.1)
  satProductCode: z.string().optional(), // c_ClaveProdServCP
  satProductDescription: z.string().optional(), // Descripción del catálogo (referencia)
  satUnitCode: z.string().optional(), // c_ClaveUnidad
  satUnitName: z.string().optional(), // Nombre de la unidad (referencia)
  currency: z.enum(["MXN", "USD", "EUR"]).default("MXN"),

  // Descripción
  description: z.string().min(1, "Descripción requerida"),

  // Cantidades
  units: z.coerce.number().min(1, "La cantidad debe ser mayor a 0").optional(),
  weight: z.coerce.number().min(0, "El peso no puede ser negativo").optional(),
  weightInKg: z.coerce.number().min(0, "El peso no puede ser negativo").optional(), // Carta Porte

  // Seguro de carga
  // Si isInsured, se exigen valor declarado, aseguradora y póliza (ver superRefine).
  isInsured: z.boolean().default(false),
  declaredValue: z.coerce.number().min(0, "El valor no puede ser negativo").optional(),
  aseguraCarga: z.string().max(80, "Aseguradora demasiado larga").optional(),
  polizaCarga: z.string().max(40, "Póliza demasiado larga").optional(),

  // NOTA FUTURA: Los campos `rate` y `currency` fueron eliminados del nivel de carga.
  // Para implementar viajes consolidados (grupaje/LTL multi-cliente), se deberá agregar
  // una tabla de prorrateo de tarifa por carga/cliente derivada de la tarifa base del viaje.

  // Material peligroso (Carta Porte 3.1)
  hazardousMaterial: z.boolean().default(false),
  requiresHazmat: z.boolean().default(false),
  hazardousMaterialCode: z.string().optional(), // c_MaterialPeligroso
  packagingType: z.string().optional(), // c_TipoEmbalaje
  packagingDescription: z.string().optional(),

  // Sectores regulados (Carta Porte 3.1 §6.4)
  sectorRequirements: z
    .object({
      sectorCofepris: z.boolean().optional(),
      nombreIngredienteActivo: z.boolean().optional(),
      nomQuimico: z.boolean().optional(),
      denominacionGenericaProd: z.boolean().optional(),
      denominacionDistintivaProd: z.boolean().optional(),
      fabricante: z.boolean().optional(),
      fechaCaducidad: z.boolean().optional(),
      loteMedicamento: z.boolean().optional(),
      formaFarmaceutica: z.boolean().optional(),
      condicionesEspTransp: z.boolean().optional(),
      registroSanitarioFolioAutorizacion: z.boolean().optional(),
      permisoImportacion: z.boolean().optional(),
      folioImpoVucem: z.boolean().optional(),
      numCas: z.boolean().optional(),
      razonSocialEmpImp: z.boolean().optional(),
      numRegSanPlagCofepris: z.boolean().optional(),
      datosFabricante: z.boolean().optional(),
      datosFormulador: z.boolean().optional(),
      datosMaquilador: z.boolean().optional(),
      usoAutorizado: z.boolean().optional(),
    })
    .optional(),
  sectorCofepris: z.string().max(10, "Sector COFEPRIS inválido").optional(),
  nombreIngredienteActivo: z
    .string()
    .max(254, "Nombre de ingrediente activo muy largo")
    .optional(),
  nomQuimico: z.string().max(254, "Nombre químico muy largo").optional(),
  denominacionGenericaProd: z
    .string()
    .max(254, "Denominación genérica muy larga")
    .optional(),
  denominacionDistintivaProd: z
    .string()
    .max(254, "Denominación distintiva muy larga")
    .optional(),
  fabricante: z.string().max(254, "Fabricante muy largo").optional(),
  fechaCaducidad: z.string().optional(),
  loteMedicamento: z.string().max(60, "Lote muy largo").optional(),
  formaFarmaceutica: z.string().max(100, "Forma farmacéutica muy larga").optional(),
  condicionesEspTransp: z
    .string()
    .max(100, "Condiciones especiales muy largas")
    .optional(),
  registroSanitarioFolioAutorizacion: z
    .string()
    .max(60, "Registro sanitario / folio demasiado largo")
    .optional(),
  permisoImportacion: z.string().max(60, "Permiso de importación muy largo").optional(),
  folioImpoVucem: z.string().max(60, "Folio VUCEM muy largo").optional(),
  numCas: z.string().max(40, "Número CAS muy largo").optional(),
  razonSocialEmpImp: z
    .string()
    .max(254, "Razón social importadora muy larga")
    .optional(),
  numRegSanPlagCofepris: z
    .string()
    .max(80, "Registro sanitario plaguicida muy largo")
    .optional(),
  datosFabricante: z.string().max(254, "Datos de fabricante muy largos").optional(),
  datosFormulador: z.string().max(254, "Datos de formulador muy largos").optional(),
  datosMaquilador: z.string().max(254, "Datos de maquilador muy largos").optional(),
  usoAutorizado: z.string().max(254, "Uso autorizado muy largo").optional(),

  // Movimientos en paradas
  movements: z.array(cargoMovementSchema).optional(),

  // Notas
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
})
  .superRefine((cargo, ctx) => {
    if (!cargo.satProductCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el producto de transporte",
        path: ["satProductCode"],
      });
    }

    if (!cargo.satUnitCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona la unidad de medida",
        path: ["satUnitCode"],
      });
    }

    if (cargo.units == null || Number.isNaN(Number(cargo.units)) || cargo.units <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Captura una cantidad mayor a 0",
        path: ["units"],
      });
    }

    if (
      cargo.weightInKg == null ||
      Number.isNaN(Number(cargo.weightInKg)) ||
      cargo.weightInKg <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Captura el peso total en kilogramos",
        path: ["weightInKg"],
      });
    }

    const hazmatRequired = isHazmatRequired(cargo);
    if (hazmatRequired && !cargo.hazardousMaterial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Este producto requiere capturar material peligroso según catálogo SAT",
        path: ["hazardousMaterial"],
      });
    }

    if (hazmatRequired) {
      const hazmatCode = cargo.hazardousMaterialCode?.trim() ?? "";
      if (!hazmatCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona la clave de material peligroso",
          path: ["hazardousMaterialCode"],
        });
      }

      const packagingType = cargo.packagingType?.trim() ?? "";
      if (!packagingType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona el tipo de embalaje",
          path: ["packagingType"],
        });
      }

      const packagingDescription = cargo.packagingDescription?.trim() ?? "";
      if (!packagingDescription) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Captura la descripción del embalaje",
          path: ["packagingDescription"],
        });
      }
    }

    const missingSectorFields = getMissingSectorRequiredFields({
      requirements: cargo.sectorRequirements,
      values: {
        sectorCofepris: cargo.sectorCofepris,
        nombreIngredienteActivo: cargo.nombreIngredienteActivo,
        nomQuimico: cargo.nomQuimico,
        denominacionGenericaProd: cargo.denominacionGenericaProd,
        denominacionDistintivaProd: cargo.denominacionDistintivaProd,
        fabricante: cargo.fabricante,
        fechaCaducidad: cargo.fechaCaducidad,
        loteMedicamento: cargo.loteMedicamento,
        formaFarmaceutica: cargo.formaFarmaceutica,
        condicionesEspTransp: cargo.condicionesEspTransp,
        registroSanitarioFolioAutorizacion:
          cargo.registroSanitarioFolioAutorizacion,
        permisoImportacion: cargo.permisoImportacion,
        folioImpoVucem: cargo.folioImpoVucem,
        numCas: cargo.numCas,
        razonSocialEmpImp: cargo.razonSocialEmpImp,
        numRegSanPlagCofepris: cargo.numRegSanPlagCofepris,
        datosFabricante: cargo.datosFabricante,
        datosFormulador: cargo.datosFormulador,
        datosMaquilador: cargo.datosMaquilador,
        usoAutorizado: cargo.usoAutorizado,
      },
    });

    for (const field of missingSectorFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Captura "${sectorFieldLabels[field]}" para esta mercancía`,
        path: [field],
      });
    }

    if (!cargo.isInsured) return;

    const dv = cargo.declaredValue;
    if (
      dv === undefined ||
      dv === null ||
      Number.isNaN(Number(dv)) ||
      Number(dv) <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "El valor declarado es obligatorio cuando la mercancía está asegurada",
        path: ["declaredValue"],
      });
    }

    const aseg = cargo.aseguraCarga?.trim() ?? "";
    if (!aseg) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La aseguradora de la carga es obligatoria cuando la mercancía está asegurada",
        path: ["aseguraCarga"],
      });
    }

    const pol = cargo.polizaCarga?.trim() ?? "";
    if (!pol) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La póliza de la carga es obligatoria cuando la mercancía está asegurada",
        path: ["polizaCarga"],
      });
    }

  });

// ============================================================================
// EXPENSE SCHEMA
// ============================================================================

export const tripExpenseSchema = z.object({
  id: z.string().optional(),

  // Clasificación
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

  // Descripción y monto
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().min(0, "El monto no puede ser negativo"),
  currency: z.literal("MXN").default("MXN"),

  // Proveedor (opcional, para referencia operativa)
  vendorName: z.string().optional(),

  // Notas
  notes: z.string().optional(),

  // Flag de planeación
  isEstimated: z.boolean().default(true),

  // NOTA FUTURA: Los campos de contabilidad (CFDI UUID, RFC del proveedor,
  // clave SAT, forma de pago, tipo de cambio) deben capturarse en el módulo
  // de liquidación post-viaje, no durante la planeación.
});

export const internalStaffSchema = z.object({
  employeeId: z.string().min(1, "Empleado requerido"),
  isPaymentResponsible: z.boolean().default(false),
  paymentNotes: z
    .string()
    .max(300, "Notas de pago muy largas")
    .optional()
    .or(z.literal("")),
});

// ============================================================================
// FULL WIZARD SCHEMA
// ============================================================================

export const tripWizardSchema = z.object({
  // Paso 1: Información Básica
  vehicleId: z.string().min(1, "Vehículo requerido"),
  driverId: z.string().min(1, "Conductor requerido"),
  clientId: z.string().optional(),
  /**
   * Intención del comprobante fiscal asociado al viaje (orientación UX y futuro timbrado).
   * No sustituye la decisión del PAC; Profact valida RFC en timbrado.
   */
  cfdiDocumentIntent: z.enum(["ingreso", "traslado"]).default("ingreso"),
  scheduledDeparture: z.string().min(1, "Fecha de salida requerida"),
  // Derivado del estimatedArrival de la parada de destino (Paso 2)
  scheduledArrival: z.string().optional(),
  startMileage: z.coerce.number().min(0).optional(),
  vehicleCurrentMileage: z.coerce.number().min(0).optional(),

  // Paso 2: Ruta
  stops: z.array(tripStopSchema).min(2, "Se requieren al menos 2 paradas"),

  // Paso 3: Carga
  cargos: z.array(tripCargoSchema),

  // Paso 4: Costos
  expenses: z.array(tripExpenseSchema),
  baseRate: z.coerce.number().min(0).optional(),
  internalStaff: z.array(internalStaffSchema).default([]),

  // Paso 5: Notas
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  const assigned = new Set<string>();

  for (let index = 0; index < data.internalStaff.length; index++) {
    const member = data.internalStaff[index];
    const id = member.employeeId;

    if (assigned.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["internalStaff", index, "employeeId"],
        message: "Este empleado ya fue agregado",
      });
    } else {
      assigned.add(id);
    }
  }
});

// ============================================================================
// TYPES INFERRED FROM SCHEMAS
// ============================================================================

export type TripStopFormValues = z.infer<typeof tripStopSchema>;
export type CargoMovementFormValues = z.infer<typeof cargoMovementSchema>;
export type TripCargoFormValues = z.infer<typeof tripCargoSchema>;
export type TripExpenseFormValues = z.infer<typeof tripExpenseSchema>;
export type InternalStaffFormValues = z.infer<typeof internalStaffSchema>;
export type TripWizardFormValues = z.infer<typeof tripWizardSchema>;

// ============================================================================
// WIZARD STEPS CONFIGURATION
// ============================================================================

export const WIZARD_STEPS = [
  {
    id: "basic",
    title: "Información",
    description: "Asignaciones y programación",
    fields: [
      "vehicleId",
      "driverId",
      "clientId",
      "cfdiDocumentIntent",
      "scheduledDeparture",
      "startMileage",
      "internalStaff",
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
  cfdiDocumentIntent: "ingreso",
  scheduledDeparture: "",
  scheduledArrival: "",
  startMileage: undefined,
  vehicleCurrentMileage: undefined,
  stops: [],
  cargos: [],
  expenses: [],
  internalStaff: [],
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
  addressId: "",
  locationName: "",
  satCountryCode: "MEX",
  satStateCode: "",
  satMunicipalityCode: "",
  postalCode: "",
  satLocalityCode: "",
  satNeighborhoodCode: "",
  cityName: "",
  neighborhoodName: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  reference: "",
  rfcRemitenteDestinatario: "",
  nombreRemitenteDestinatario: "",
  deliveryRfcRemitenteDestinatario: "",
  deliveryNombreRemitenteDestinatario: "",
  remitentePartnerId: "",
  destinatarioPartnerId: "",
  contactName: "",
  contactPhone: "",
  notes: "",
  distanceFromPreviousKm: undefined,
  distanceSource: undefined,
  distanceProvider: undefined,
  distanceConfidence: undefined,
  distanceComputedAt: undefined,
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
    errors.push("Agrega la parada de origen para iniciar la ruta");
  } else if (originStops.length > 1) {
    errors.push("Deja solo una parada de origen");
  }

  // Validar destino
  if (destinationStops.length === 0) {
    errors.push("Agrega la parada de destino para cerrar la ruta");
  } else if (destinationStops.length > 1) {
    errors.push("Deja solo una parada de destino");
  }

  // Validar que origen tenga pickup
  if (originStops.length === 1) {
    const origin = originStops[0];
    if (!origin.stopType.includes("pickup")) {
      errors.push("Configura la parada de origen con operación de carga");
    }
  }

  // Validar que destino tenga delivery
  if (destinationStops.length === 1) {
    const destination = destinationStops[0];
    if (!destination.stopType.includes("delivery")) {
      errors.push("Configura la parada de destino con operación de descarga");
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
      errors.push(`Completa "${label}" con al menos una operación`);
    }
  }

  // Validar campos Carta Porte en cada parada
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const label = stop.locationName || `Parada ${i + 1}`;

    if (!stopHasUnifiedAddressId(stop)) {
      if (!stop.satCountryCode?.trim()) {
          errors.push(`Completa "${label}" con ${LOCATION_CAPTURE_LABELS.country}`);
      }
      if (!stop.satStateCode?.trim()) {
          errors.push(`Completa "${label}" con ${LOCATION_CAPTURE_LABELS.state}`);
      }
      if (!stop.satMunicipalityCode?.trim()) {
          errors.push(
            `Completa "${label}" con ${LOCATION_CAPTURE_LABELS.municipality}`,
          );
      }
      if (!/^\d{5}$/.test(stop.postalCode?.trim() ?? "")) {
          errors.push(
            `Completa "${label}" con ${LOCATION_CAPTURE_LABELS.postalCode} válido`,
          );
      }
    }

    if (stop.latitude == null || stop.longitude == null) {
      errors.push(`Confirma geolocalización en mapa para "${label}"`);
    }

    // estimatedArrival obligatorio en destino, recomendado en waypoints
    const isDestination = stop.stopType.includes("destination");
    const isWaypoint =
      stop.stopType.includes("waypoint") &&
      !stop.stopType.includes("origin") &&
      !stop.stopType.includes("destination");

    if (isDestination && !stop.estimatedArrival) {
      errors.push(`Completa "${label}" con hora estimada de llegada`);
    } else if (isWaypoint && !stop.estimatedArrival) {
      warnings.push(
        `"${label}" no tiene hora estimada. Se interpolará automáticamente en la documentación fiscal.`,
      );
    }
  }

  // Advertencias
  if (waypointStops.length === 0 && errors.length === 0) {
    warnings.push(
      "No hay escalas intermedias. Es válido; agrega una solo si la operación lo requiere.",
    );
  }

  // Escalas mixtas: segunda contraparte fiscal recomendada (no bloqueante en v1)
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const label = stop.locationName || `Parada ${i + 1}`;
    const isMixedWaypointScale =
      stop.stopType.includes("waypoint") &&
      stop.stopType.includes("pickup") &&
      stop.stopType.includes("delivery");
    if (isMixedWaypointScale) {
      const dRfc = (stop.deliveryRfcRemitenteDestinatario ?? "").trim();
      const dName = (stop.deliveryNombreRemitenteDestinatario ?? "").trim();
      if (!dRfc || !dName) {
        warnings.push(
          `"${label}": esta escala tiene carga y descarga; conviene capturar RFC y nombre del destinatario (descarga) además del remitente (carga).`,
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

