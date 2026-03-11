/**
 * Trip Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del negocio, Value Objects, Enums y Constantes.
 * Los DTOs e Interfaces de repositorio están en repository.ts (Ports).
 *
 * REGLA: Esta capa NO debe importar nada de otras capas.
 */

// ============================================================================
// ENUMS
// ============================================================================

export const TripStatus = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type TripStatusType = (typeof TripStatus)[keyof typeof TripStatus];

export const StopType = {
  ORIGIN: "origin",
  PICKUP: "pickup",
  DELIVERY: "delivery",
  WAYPOINT: "waypoint",
  DESTINATION: "destination",
} as const;

export type StopTypeValue = (typeof StopType)[keyof typeof StopType];

export const StopStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export type StopStatusValue = (typeof StopStatus)[keyof typeof StopStatus];

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

export const ExpenseStatus = {
  PENDING: "pending",
  DOCUMENTED: "documented",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ExpenseStatusType =
  (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const CargoAction = {
  PICKUP: "pickup",
  DELIVERY: "delivery",
  PARTIAL_DELIVERY: "partial_delivery",
} as const;

export type CargoActionType = (typeof CargoAction)[keyof typeof CargoAction];

export const CargoMovementType = {
  PICKUP: "pickup",
  DELIVERY: "delivery",
} as const;

export type CargoMovementTypeValue =
  (typeof CargoMovementType)[keyof typeof CargoMovementType];

export const CargoStatus = {
  PENDING: "pending",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  RETURNED: "returned",
  CANCELLED: "cancelled",
} as const;

export type CargoStatusType = (typeof CargoStatus)[keyof typeof CargoStatus];

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface Mileage {
  readonly start: number | null;
  readonly end: number | null;
}

export interface CargoInfo {
  readonly description: string | null;
  readonly weight: number | null;
  readonly volume: number | null;
  readonly units: number | null;
  readonly value: number | null;
}

export interface CostBreakdown {
  readonly baseRate: number;
  readonly fuelCost: number;
  readonly tollCost: number;
  readonly otherCosts: number;
  readonly totalCost: number;
}

export interface DetailedCostBreakdown {
  readonly fuel: number;
  readonly tolls: number;
  readonly driverAllowance: number;
  readonly lodging: number;
  readonly loadingUnloading: number;
  readonly parking: number;
  readonly maintenance: number;
  readonly insurance: number;
  readonly permits: number;
  readonly other: number;
  readonly totalExpenses: number;
}

export interface TripProfitability {
  readonly totalRevenue: number;
  readonly totalExpenses: number;
  readonly grossProfit: number;
  readonly profitMargin: number;
  readonly revenuePerKm: number | null;
  readonly costPerKm: number | null;
  readonly isEstimated: boolean;
}

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * Movimiento de Carga
 *
 * Conecta una carga con una parada (pickup o delivery parcial/total).
 * Una carga tiene 1 pickup y 0..N deliveries.
 */
export interface CargoMovement {
  readonly id?: string;
  readonly cargoId?: string;
  readonly stopId?: string;
  readonly stopIndex: number;
  readonly movementType: CargoMovementTypeValue;
  readonly weight: number | null;
  readonly units: number | null;
  readonly completedAt: Date | null;
  readonly notes: string | null;
}

/**
 * Carga (Cargo/Shipment)
 * Mercancía asociada a un viaje con movimientos pickup/delivery.
 */
export interface TripCargo {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly clientId: string;
  readonly client?: ClientRef;

  readonly description: string;
  readonly productType: string | null;
  readonly weight: number | null;
  readonly volume: number | null;
  readonly units: number | null;
  readonly declaredValue: number | null;

  readonly rate: number;
  readonly currency: string;

  // Movimientos (modelo actual)
  readonly movements: CargoMovement[];

  // Legacy (compatibilidad backend actual)
  // readonly pickupStopId: string | null;
  // readonly deliveryStopId: string | null;

  readonly status: CargoStatusType;
  // readonly pickedUpAt: Date | null;
  // readonly deliveredAt: Date | null;

  readonly notes: string | null;
  readonly specialInstructions: string | null;

  // ── Carta Porte 3.1 — Nodo Mercancía ──────────────────────────
  readonly satProductCode: string | null; // Catálogo c_ClaveProdServCP (8 dígitos, ej: "24131510")
  readonly satUnitCode: string | null; // Catálogo c_ClaveUnidad (ej: "KGM", "H87", "XBX")
  readonly satUnitName: string | null; // Nombre unidad (ej: "Kilogramo", "Pieza")
  readonly weightInKg: number | null; // Peso obligatorio en kg para Carta Porte (PesoEnKg)
  readonly dimensions: string | null; // Largo/Alto/Ancho en cm (ej: "50/40/30cm")

  // Material peligroso
  readonly hazardousMaterial: boolean | null; // ¿Transporta material peligroso?
  readonly hazardousMaterialCode: string | null; // Catálogo c_MaterialPeligroso (ej: "1203")
  readonly packagingType: string | null; // Catálogo c_TipoEmbalaje (ej: "4H2")
  readonly packagingDescription: string | null; // Descripción del embalaje

  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

/**
 * Gasto del Viaje (TripExpense)
 */
export interface TripExpense {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;

  // Categorización
  readonly category: ExpenseCategoryType;
  readonly subcategory: string | null; // Subcategoría opcional
  readonly satCatalogKey: string | null; // Clave del catálogo SAT si aplica

  // Información del gasto
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly exchangeRate: number | null; // Si es moneda extranjera

  // Fecha y ubicación
  readonly expenseDate: Date;
  readonly location: string | null; // Lugar donde se realizó el gasto
  readonly latitude: number | null;
  readonly longitude: number | null;

  // Comprobante/Ticket
  readonly hasReceipt: boolean;
  readonly receiptUrl: string | null; // URL del comprobante adjunto
  readonly receiptNumber: string | null; // Número de factura/ticket
  readonly receiptUuid: string | null; // UUID del CFDI si es factura

  // Proveedor
  readonly vendorName: string | null;
  readonly vendorRfc: string | null;

  // Estado y aprobación
  readonly status: ExpenseStatusType;
  readonly isEstimated: boolean; // Indica si es un gasto estimado (sin comprobante)
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly rejectionReason: string | null;

  // Notas
  readonly notes: string | null;

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

/**
 * Parada de viaje (TripStop)
 */
export interface TripStop {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly sequenceOrder: number;
  readonly stopType: StopTypeValue[];
  readonly address: string;
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationName: string | null;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly estimatedArrival: Date | null;
  readonly actualArrival: Date | null;
  readonly estimatedDeparture: Date | null;
  readonly actualDeparture: Date | null;
  readonly cargoActionDescription: string | null;
  readonly cargoWeight: number | null;
  readonly cargoUnits: number | null;
  readonly status: StopStatusValue;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // ── Carta Porte 3.1 — Nodo Ubicación / Domicilio ──────────────
  // Dirección desglosada (el campo `address` se mantiene como dirección de texto libre)
  readonly street: string | null;
  readonly exteriorNumber: string | null;
  readonly interiorNumber: string | null;
  readonly colonia: string | null;
  readonly reference: string | null;

  // Claves SAT (catálogos oficiales del SAT)
  readonly satEstadoCode: string | null; // Catálogo c_Estado (ej: "MEX", "SLP", "NLE")
  readonly satMunicipioCode: string | null; // Catálogo c_Municipio (ej: "028")
  readonly satLocalidadCode: string | null; // Catálogo c_Localidad (ej: "05")
  readonly satColoniaCode: string | null; // Catálogo c_Colonia (ej: "0001")

  // Datos del remitente/destinatario en esta ubicación
  readonly rfcRemitenteDestinatario: string | null; // RFC de quien envía/recibe en esta parada

  // Distancia recorrida (obligatorio para destinos en Carta Porte)
  readonly distanceToNextKm: number | null; // km desde ubicación anterior

  readonly cargos?: TripCargo[];
}

/**
 * Historial de estado del viaje
 */
export interface TripStatusHistory {
  readonly id: string;
  readonly tripId: string;
  readonly previousStatus: TripStatusType | null;
  readonly newStatus: TripStatusType;
  readonly changedBy: string | null;
  readonly changedByName: string | null;
  readonly changedAt: Date;
  readonly mileage: number | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly reason: string | null;
}

// ============================================================================
// REFERENCE ENTITIES
// ============================================================================

export interface VehicleRef {
  readonly id: string;
  readonly unitNumber: string;
  readonly licensePlate: string;
}

export interface DriverRef {
  readonly id: string;
  readonly fullName: string;
}

export interface ClientRef {
  readonly id: string;
  readonly legalName: string;
}

// ============================================================================
// LIST / DETAIL ENTITIES
// ============================================================================

export interface TripListItem {
  readonly id: string;
  readonly tripCode: string;
  readonly vehicle: VehicleRef;
  readonly driver: DriverRef;
  readonly client: ClientRef | null;
  readonly originCity: string;
  readonly destinationCity: string;
  readonly scheduledDeparture: Date;
  readonly scheduledArrival: Date | null;
  readonly status: TripStatusType;
  readonly cargoDescription: string | null;
  readonly totalCost: number;
  readonly totalRevenue: number;
  readonly estimatedProfit: number;
  readonly cargoCount: number;
  readonly clientCount: number;
  readonly createdAt: Date;
}

/**
 * Viaje (Trip) - Aggregate Root
 */
export interface Trip {
  readonly id: string;
  readonly tenantId: string;
  readonly tripCode: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly clientId: string | null;
  readonly scheduledDeparture: Date;
  readonly scheduledArrival: Date | null;
  readonly actualDeparture: Date | null;
  readonly actualArrival: Date | null;
  readonly mileage: Mileage;
  readonly originAddress: string;
  readonly originCity: string;
  readonly originState: string | null;
  readonly destinationAddress: string;
  readonly destinationCity: string;
  readonly destinationState: string | null;
  readonly cargo: CargoInfo;
  readonly costs: CostBreakdown;
  readonly detailedCosts: DetailedCostBreakdown | null;
  readonly profitability: TripProfitability | null;
  readonly status: TripStatusType;
  readonly notes: string | null;
  readonly cancellationReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;

  readonly vehicle?: VehicleRef;
  readonly driver?: DriverRef;
  readonly client?: ClientRef;
  readonly stops?: TripStop[];
  readonly cargos?: TripCargo[];
  readonly expenses?: TripExpense[];
  readonly statusHistory?: TripStatusHistory[];
}

export interface TripDetail extends Trip {
  readonly vehicle: VehicleRef;
  readonly driver: DriverRef;
  readonly client: ClientRef | undefined;
  readonly stops: TripStop[];
  readonly cargos: TripCargo[];
  readonly expenses: TripExpense[];
  readonly statusHistory: TripStatusHistory[];
  readonly profitability: TripProfitability;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface TripFilters {
  readonly status?: TripStatusType | TripStatusType[];
  readonly clientId?: string;
  readonly driverId?: string;
  readonly vehicleId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly search?: string;
  readonly minProfit?: number;
  readonly maxProfit?: number;
}

export interface SortOptions {
  readonly field:
    | "scheduled_departure"
    | "trip_code"
    | "status"
    | "total_cost"
    | "total_revenue"
    | "profit"
    | "origin_city"
    | "created_at";
  readonly direction: "asc" | "desc";
}

export interface TripQueryParams {
  readonly filters?: TripFilters;
  readonly sort?: SortOptions;
  readonly page?: number;
  readonly limit?: number;
}

export const tripQueryKeys = {
  all: ["trips"] as const,
  lists: () => [...tripQueryKeys.all, "list"] as const,
  list: (params?: TripQueryParams) =>
    [...tripQueryKeys.lists(), params] as const,
  details: () => [...tripQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...tripQueryKeys.details(), id] as const,
  stops: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "stops"] as const,
  cargos: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "cargos"] as const,
  expenses: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "expenses"] as const,
  profitability: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "profitability"] as const,
};

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

export const VALID_STATUS_TRANSITIONS: Record<
  TripStatusType,
  TripStatusType[]
> = {
  [TripStatus.DRAFT]: [TripStatus.SCHEDULED, TripStatus.CANCELLED],
  [TripStatus.SCHEDULED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

export const UNIQUE_STOP_TYPES: readonly StopTypeValue[] = [
  StopType.ORIGIN,
  StopType.DESTINATION,
] as const;

// ============================================================================
// UI LABELS
// ============================================================================

export const TRIP_STATUS_LABELS: Record<TripStatusType, string> = {
  [TripStatus.DRAFT]: "Borrador",
  [TripStatus.SCHEDULED]: "Programado",
  [TripStatus.IN_PROGRESS]: "En Curso",
  [TripStatus.COMPLETED]: "Completado",
  [TripStatus.CANCELLED]: "Cancelado",
};

export const STOP_TYPE_LABELS: Record<StopTypeValue, string> = {
  [StopType.ORIGIN]: "Origen",
  [StopType.PICKUP]: "Carga",
  [StopType.DELIVERY]: "Descarga",
  [StopType.WAYPOINT]: "Escala",
  [StopType.DESTINATION]: "Destino",
};

export const STOP_STATUS_LABELS: Record<StopStatusValue, string> = {
  [StopStatus.PENDING]: "Pendiente",
  [StopStatus.IN_PROGRESS]: "En Progreso",
  [StopStatus.COMPLETED]: "Completado",
  [StopStatus.SKIPPED]: "Omitido",
};

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

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatusType, string> = {
  [ExpenseStatus.PENDING]: "Pendiente",
  [ExpenseStatus.DOCUMENTED]: "Documentado",
  [ExpenseStatus.APPROVED]: "Aprobado",
  [ExpenseStatus.REJECTED]: "Rechazado",
};

export const CARGO_ACTION_LABELS: Record<CargoActionType, string> = {
  [CargoAction.PICKUP]: "Recoger",
  [CargoAction.DELIVERY]: "Entregar",
  [CargoAction.PARTIAL_DELIVERY]: "Entrega Parcial",
};

export const CARGO_STATUS_LABELS: Record<CargoStatusType, string> = {
  [CargoStatus.PENDING]: "Pendiente",
  [CargoStatus.IN_TRANSIT]: "En Tránsito",
  [CargoStatus.DELIVERED]: "Entregada",
  [CargoStatus.RETURNED]: "Devuelta",
  [CargoStatus.CANCELLED]: "Cancelada",
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
