/**
 * Trip Domain Enums, Labels & Constants
 * Clean Architecture - Domain Layer
 *
 * Contiene:
 * - Enums y tipos de estado
 * - Labels para UI (español)
 * - Colores e iconos para visualización
 * - Constantes de dominio
 *
 * Ubicación: src/features/trips/domain/enums.ts
 */

import { VALID_STATUS_TRANSITIONS } from "@boeltech/cfdi-domain";

// ============================================================================
// TRIP STATUS
// ============================================================================

export const TripStatus = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type TripStatusType = (typeof TripStatus)[keyof typeof TripStatus];

/** ADR-0079: desenlace operativo del viaje (independiente de `status`). */
export const TripOperationalOutcome = {
  STANDARD: "standard",
  FALSE_TRIP: "false_trip",
} as const;

export type TripOperationalOutcomeType =
  (typeof TripOperationalOutcome)[keyof typeof TripOperationalOutcome];

export const TRIP_STATUS_LABELS: Record<TripStatusType, string> = {
  [TripStatus.DRAFT]: "Reserva",
  [TripStatus.SCHEDULED]: "Programado",
  [TripStatus.IN_PROGRESS]: "En Curso",
  [TripStatus.COMPLETED]: "Completado",
  [TripStatus.CANCELLED]: "Cancelado",
};

/** Matriz de transiciones: fuente única en `@boeltech/cfdi-domain` (`entidades/trip`). */
export { VALID_STATUS_TRANSITIONS };

// ============================================================================
// STOP TYPE
// ============================================================================

export const StopType = {
  ORIGIN: "origin",
  PICKUP: "pickup",
  DELIVERY: "delivery",
  WAYPOINT: "waypoint",
  DESTINATION: "destination",
} as const;

export type StopTypeValue = (typeof StopType)[keyof typeof StopType];

export const STOP_TYPE_LABELS: Record<StopTypeValue, string> = {
  [StopType.ORIGIN]: "Origen",
  [StopType.PICKUP]: "Carga",
  [StopType.DELIVERY]: "Descarga",
  [StopType.WAYPOINT]: "Escala",
  [StopType.DESTINATION]: "Destino",
};

export const UNIQUE_STOP_TYPES: readonly StopTypeValue[] = [
  StopType.ORIGIN,
  StopType.DESTINATION,
] as const;

// ============================================================================
// STOP STATUS
// ============================================================================

export const StopStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export type StopStatusValue = (typeof StopStatus)[keyof typeof StopStatus];

export const STOP_STATUS_LABELS: Record<StopStatusValue, string> = {
  [StopStatus.PENDING]: "Pendiente",
  [StopStatus.IN_PROGRESS]: "En Progreso",
  [StopStatus.COMPLETED]: "Completado",
  [StopStatus.SKIPPED]: "Omitido",
};

// ============================================================================
// EXPENSE CATEGORY
// ============================================================================

export const ExpenseCategory = {
  FUEL: "fuel",
  TOLLS: "tolls",
  DRIVER_ALLOWANCE: "driver_allowance",
  LODGING: "lodging",
  LOADING_UNLOADING: "loading_unloading",
  PARKING: "parking",
  MAINTENANCE: "maintenance",
  INSURANCE: "insurance",
  PERMITS: "permits",
  OTHER: "other",
} as const;

export type ExpenseCategoryType =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryType, string> = {
  [ExpenseCategory.FUEL]: "Combustible",
  [ExpenseCategory.TOLLS]: "Casetas/Peajes",
  [ExpenseCategory.DRIVER_ALLOWANCE]: "Viáticos del Operador",
  [ExpenseCategory.LODGING]: "Hospedaje",
  [ExpenseCategory.LOADING_UNLOADING]: "Maniobras Carga/Descarga",
  [ExpenseCategory.PARKING]: "Pensión/Estacionamiento",
  [ExpenseCategory.MAINTENANCE]: "Mantenimiento en Ruta",
  [ExpenseCategory.INSURANCE]: "Seguros",
  [ExpenseCategory.PERMITS]: "Permisos y Trámites",
  [ExpenseCategory.OTHER]: "Otros Gastos",
};

export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategoryType, string> = {
  [ExpenseCategory.FUEL]: "fuel",
  [ExpenseCategory.TOLLS]: "toll",
  [ExpenseCategory.DRIVER_ALLOWANCE]: "wallet",
  [ExpenseCategory.LODGING]: "bed",
  [ExpenseCategory.LOADING_UNLOADING]: "package",
  [ExpenseCategory.PARKING]: "parking",
  [ExpenseCategory.MAINTENANCE]: "wrench",
  [ExpenseCategory.INSURANCE]: "shield",
  [ExpenseCategory.PERMITS]: "file-text",
  [ExpenseCategory.OTHER]: "more-horizontal",
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategoryType, string> = {
  [ExpenseCategory.FUEL]: "#ef4444",
  [ExpenseCategory.TOLLS]: "#f97316",
  [ExpenseCategory.DRIVER_ALLOWANCE]: "#eab308",
  [ExpenseCategory.LODGING]: "#22c55e",
  [ExpenseCategory.LOADING_UNLOADING]: "#14b8a6",
  [ExpenseCategory.PARKING]: "#3b82f6",
  [ExpenseCategory.MAINTENANCE]: "#8b5cf6",
  [ExpenseCategory.INSURANCE]: "#ec4899",
  [ExpenseCategory.PERMITS]: "#6b7280",
  [ExpenseCategory.OTHER]: "#a3a3a3",
};

// ============================================================================
// EXPENSE STATUS
// ============================================================================

export const ExpenseStatus = {
  PENDING: "pending",
  DOCUMENTED: "documented",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ExpenseStatusType =
  (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatusType, string> = {
  [ExpenseStatus.PENDING]: "Pendiente",
  [ExpenseStatus.DOCUMENTED]: "Documentado",
  [ExpenseStatus.APPROVED]: "Aprobado",
  [ExpenseStatus.REJECTED]: "Rechazado",
};

// ============================================================================
// CARGO STATUS
// ============================================================================

export const CargoStatus = {
  PENDING: "pending",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  RETURNED: "returned",
  CANCELLED: "cancelled",
} as const;

export type CargoStatusType = (typeof CargoStatus)[keyof typeof CargoStatus];

export const CARGO_STATUS_LABELS: Record<CargoStatusType, string> = {
  [CargoStatus.PENDING]: "Pendiente",
  [CargoStatus.IN_TRANSIT]: "En Tránsito",
  [CargoStatus.DELIVERED]: "Entregada",
  [CargoStatus.RETURNED]: "Devuelta",
  [CargoStatus.CANCELLED]: "Cancelada",
};

// ============================================================================
// CARGO MOVEMENT TYPE
// ============================================================================

export const CargoMovementType = {
  PICKUP: "pickup",
  DELIVERY: "delivery",
} as const;

export type CargoMovementTypeValue =
  (typeof CargoMovementType)[keyof typeof CargoMovementType];

export const CARGO_MOVEMENT_TYPE_LABELS: Record<
  CargoMovementTypeValue,
  string
> = {
  [CargoMovementType.PICKUP]: "Recoger",
  [CargoMovementType.DELIVERY]: "Entregar",
};

// ============================================================================
// CARGO ACTION (Legacy - para compatibilidad)
// ============================================================================

export const CargoAction = {
  PICKUP: "pickup",
  DELIVERY: "delivery",
  PARTIAL_DELIVERY: "partial_delivery",
} as const;

export type CargoActionType = (typeof CargoAction)[keyof typeof CargoAction];

export const CARGO_ACTION_LABELS: Record<CargoActionType, string> = {
  [CargoAction.PICKUP]: "Recoger",
  [CargoAction.DELIVERY]: "Entregar",
  [CargoAction.PARTIAL_DELIVERY]: "Entrega Parcial",
};

// ============================================================================
// CURRENCY (ISO 4217)
// ============================================================================

export const Currency = {
  MXN: "MXN",
  USD: "USD",
  EUR: "EUR",
} as const;

export type CurrencyType = (typeof Currency)[keyof typeof Currency];

export const CURRENCY_LABELS: Record<CurrencyType, string> = {
  [Currency.MXN]: "Peso Mexicano",
  [Currency.USD]: "Dólar Estadounidense",
  [Currency.EUR]: "Euro",
};

export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  [Currency.MXN]: "$",
  [Currency.USD]: "US$",
  [Currency.EUR]: "€",
};

// ============================================================================
// SAT PAYMENT METHODS (c_FormaPago)
// ============================================================================

export const SatPaymentMethod = {
  CASH: "01",
  CHECK: "02",
  TRANSFER: "03",
  CREDIT_CARD: "04",
  ELECTRONIC_WALLET: "05",
  ELECTRONIC_MONEY: "06",
  DEBIT_CARD: "28",
  TO_DEFINE: "99",
} as const;

export type SatPaymentMethodType =
  (typeof SatPaymentMethod)[keyof typeof SatPaymentMethod];

export const SAT_PAYMENT_METHOD_LABELS: Record<SatPaymentMethodType, string> = {
  [SatPaymentMethod.CASH]: "01 - Efectivo",
  [SatPaymentMethod.CHECK]: "02 - Cheque nominativo",
  [SatPaymentMethod.TRANSFER]: "03 - Transferencia electrónica",
  [SatPaymentMethod.CREDIT_CARD]: "04 - Tarjeta de crédito",
  [SatPaymentMethod.ELECTRONIC_WALLET]: "05 - Monedero electrónico",
  [SatPaymentMethod.ELECTRONIC_MONEY]: "06 - Dinero electrónico",
  [SatPaymentMethod.DEBIT_CARD]: "28 - Tarjeta de débito",
  [SatPaymentMethod.TO_DEFINE]: "99 - Por definir",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica si una transición de estado es válida
 */
export function isValidStatusTransition(
  currentStatus: TripStatusType,
  newStatus: TripStatusType,
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Verifica si un tipo de parada es único (solo puede haber una)
 */
export function isUniqueStopType(stopType: StopTypeValue): boolean {
  return UNIQUE_STOP_TYPES.includes(stopType);
}

/**
 * Obtiene el símbolo de moneda
 */
export function getCurrencySymbol(currency: CurrencyType): string {
  return CURRENCY_SYMBOLS[currency] ?? "$";
}
