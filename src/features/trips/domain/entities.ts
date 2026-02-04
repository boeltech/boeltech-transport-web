/**
 * Trip Domain Entities
 * Clean Architecture - Domain Layer
 *
 * ACTUALIZADO: Incluye entidades para Cargas (Cargo), Gastos (Expenses) y Rentabilidad
 *
 * Esta capa contiene:
 * - Entidades del negocio (sin dependencias externas)
 * - Value Objects
 * - Enums del dominio
 * - Constantes del dominio
 *
 * REGLA: Esta capa NO debe importar nada de otras capas
 */

// ============================================================================
// ENUMS - Tipos enumerados del dominio (Alineados con Backend)
// ============================================================================

/**
 * Estados posibles de un viaje
 */
export const TripStatus = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type TripStatusType = (typeof TripStatus)[keyof typeof TripStatus];

/**
 * Tipos de parada
 */
export const StopType = {
  ORIGIN: "origin",
  PICKUP: "pickup",
  DELIVERY: "delivery",
  WAYPOINT: "waypoint",
  DESTINATION: "destination",
} as const;

export type StopTypeValue = (typeof StopType)[keyof typeof StopType];

/**
 * Estados de una parada
 */
export const StopStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export type StopStatusValue = (typeof StopStatus)[keyof typeof StopStatus];

/**
 * Categorías de gastos del viaje (basado en catálogos SAT)
 */
export const ExpenseCategory = {
  FUEL: "fuel", // Combustible
  TOLLS: "tolls", // Casetas/Peajes
  DRIVER_ALLOWANCE: "driver_allowance", // Viáticos del operador
  LODGING: "lodging", // Hospedaje
  LOADING_UNLOADING: "loading_unloading", // Maniobras de carga/descarga
  PARKING: "parking", // Pensión/estacionamiento
  MAINTENANCE: "maintenance", // Refacciones/mantenimiento en ruta
  INSURANCE: "insurance", // Seguros
  PERMITS: "permits", // Permisos y trámites
  OTHER: "other", // Otros gastos
} as const;

export type ExpenseCategoryType =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

/**
 * Estados de un gasto
 */
export const ExpenseStatus = {
  PENDING: "pending", // Pendiente de comprobante
  DOCUMENTED: "documented", // Con comprobante adjunto
  APPROVED: "approved", // Aprobado
  REJECTED: "rejected", // Rechazado
} as const;

export type ExpenseStatusType =
  (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

/**
 * Tipos de acción de carga en una parada
 */
export const CargoAction = {
  PICKUP: "pickup", // Recoger carga
  DELIVERY: "delivery", // Entregar carga
  PARTIAL_DELIVERY: "partial_delivery", // Entrega parcial
} as const;

export type CargoActionType = (typeof CargoAction)[keyof typeof CargoAction];

/**
 * Estados de una carga
 */
export const CargoStatus = {
  PENDING: "pending", // Pendiente de recoger
  IN_TRANSIT: "in_transit", // En tránsito
  DELIVERED: "delivered", // Entregada
  RETURNED: "returned", // Devuelta
  CANCELLED: "cancelled", // Cancelada
} as const;

export type CargoStatusType = (typeof CargoStatus)[keyof typeof CargoStatus];

// ============================================================================
// VALUE OBJECTS - Objetos inmutables
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

/**
 * Desglose detallado de costos por categoría
 */
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

/**
 * Información de rentabilidad del viaje
 */
export interface TripProfitability {
  readonly totalRevenue: number; // Ingresos totales (suma de tarifas de cargas)
  readonly totalExpenses: number; // Gastos totales
  readonly grossProfit: number; // Utilidad bruta (Ingresos - Gastos)
  readonly profitMargin: number; // Margen de utilidad (%)
  readonly revenuePerKm: number | null; // Ingreso por kilómetro
  readonly costPerKm: number | null; // Costo por kilómetro
  readonly isEstimated: boolean; // true si es estimada, false si es real (viaje finalizado)
}

/**
 * Información para Carta Porte (CFDI con Complemento)
 */
export interface CartaPorteInfo {
  readonly claveProdServCP: string | null; // Clave producto/servicio Carta Porte
  readonly claveUnidad: string | null; // Clave unidad de medida SAT
  readonly materialPeligroso: boolean;
  readonly cveMaterialPeligroso: string | null; // Clave material peligroso
  readonly tipoEmbalaje: string | null; // Tipo de embalaje
  readonly fraccionArancelaria: string | null; // Para comercio exterior
  readonly uuidComercioExt: string | null; // UUID del pedimento
}

/**
 * Dirección completa para Carta Porte
 */
export interface CartaPorteAddress {
  readonly calle: string;
  readonly numeroExterior: string | null;
  readonly numeroInterior: string | null;
  readonly colonia: string | null;
  readonly codigoPostal: string;
  readonly localidad: string | null;
  readonly municipio: string;
  readonly estado: string;
  readonly pais: string;
  readonly referencia: string | null;
}

// ============================================================================
// ENTITIES - Entidades del dominio (Alineadas con Backend)
// ============================================================================

/**
 * Entidad: Carga (Cargo/Shipment)
 * Representa una carga que pertenece a un cliente y se asocia a paradas
 */
export interface TripCargo {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly clientId: string;
  readonly client?: ClientRef;

  // Información de la carga
  readonly description: string;
  readonly productType: string | null; // Tipo de producto
  readonly weight: number | null; // Peso en kg
  readonly volume: number | null; // Volumen en m³
  readonly units: number | null; // Cantidad de unidades/bultos
  readonly declaredValue: number | null; // Valor declarado

  // Información comercial
  readonly rate: number; // Tarifa cobrada al cliente
  readonly currency: string; // Moneda (MXN, USD, etc.)

  // Paradas asociadas (pickup y delivery)
  readonly pickupStopId: string | null; // Parada donde se recoge
  readonly deliveryStopId: string | null; // Parada donde se entrega

  // Información para Carta Porte
  readonly cartaPorteInfo: CartaPorteInfo | null;

  // Estado y tracking
  readonly status: CargoStatusType;
  readonly pickedUpAt: Date | null;
  readonly deliveredAt: Date | null;

  // Notas y observaciones
  readonly notes: string | null;
  readonly specialInstructions: string | null;

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

/**
 * Entidad: Gasto del Viaje (TripExpense)
 * Representa un gasto individual asociado al viaje
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
 * Entidad: Asociación Carga-Parada (CargoStopAssignment)
 * Permite que una carga tenga múltiples paradas (entregas parciales)
 */
export interface CargoStopAssignment {
  readonly id: string;
  readonly cargoId: string;
  readonly stopId: string;
  readonly action: CargoActionType;
  readonly quantity: number | null; // Cantidad en esta parada (para entregas parciales)
  readonly weight: number | null; // Peso en esta parada
  readonly completedAt: Date | null;
  readonly notes: string | null;
}

/**
 * Entidad: Parada de viaje (TripStop)
 * ACTUALIZADO: Incluye relación con cargas
 */
export interface TripStop {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly sequenceOrder: number;
  readonly stopType: StopTypeValue;
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

  // Relaciones con cargas (opcional, cuando se cargan con detalle)
  readonly cargoAssignments?: CargoStopAssignment[];
  readonly cargos?: TripCargo[];
}

/**
 * Entidad: Historial de estado del viaje
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

/**
 * Entidad: Vehículo (referencia embebida)
 */
export interface VehicleRef {
  readonly id: string;
  readonly unitNumber: string;
  readonly licensePlate: string;
}

/**
 * Entidad: Conductor (referencia embebida)
 */
export interface DriverRef {
  readonly id: string;
  readonly fullName: string;
}

/**
 * Entidad: Cliente (referencia embebida)
 */
export interface ClientRef {
  readonly id: string;
  readonly legalName: string;
}

/**
 * Entidad: Item de lista de viajes (para listados)
 * Versión optimizada para queries de lista
 */
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
  readonly totalRevenue: number; // NUEVO: Ingresos totales
  readonly estimatedProfit: number; // NUEVO: Rentabilidad estimada
  readonly cargoCount: number; // NUEVO: Número de cargas
  readonly clientCount: number; // NUEVO: Número de clientes
  readonly createdAt: Date;
}

/**
 * Entidad Principal: Viaje (Trip)
 * Aggregate Root del módulo de viajes
 * ACTUALIZADO: Incluye cargas, gastos y rentabilidad
 */
export interface Trip {
  readonly id: string;
  readonly tenantId: string;
  readonly tripCode: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly clientId: string | null; // Cliente principal (puede haber múltiples en cargas)
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
  readonly cargo: CargoInfo; // Información resumida de carga (legacy)
  readonly costs: CostBreakdown; // Costos resumidos (legacy)
  readonly detailedCosts: DetailedCostBreakdown | null; // NUEVO: Costos detallados
  readonly profitability: TripProfitability | null; // NUEVO: Rentabilidad
  readonly status: TripStatusType;
  readonly notes: string | null;
  readonly cancellationReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;

  // Relaciones (opcionales, para cuando se cargan con detalle)
  readonly vehicle?: VehicleRef;
  readonly driver?: DriverRef;
  readonly client?: ClientRef;
  readonly stops?: TripStop[];
  readonly cargos?: TripCargo[]; // NUEVO: Lista de cargas
  readonly expenses?: TripExpense[]; // NUEVO: Lista de gastos
  readonly statusHistory?: TripStatusHistory[];
}

/**
 * Entidad: Detalle completo del viaje
 * Incluye todas las relaciones cargadas
 */
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
// DOMAIN TYPES - Tipos auxiliares del dominio
// ============================================================================

/**
 * Resultado de una operación de dominio
 */
export type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError };

/**
 * Error de dominio
 */
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

/**
 * Resultado de caso de uso
 */
export type UseCaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Resultado de validación
 */
export type ValidationResult =
  | { success: true }
  | { success: false; error: { code: string; message: string } };

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Información de paginación
 */
export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

/**
 * Lista paginada genérica
 */
export interface PaginatedList<T> {
  readonly items: T[];
  readonly pagination: Pagination;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Filtros de búsqueda de viajes
 */
export interface TripFilters {
  readonly status?: TripStatusType | TripStatusType[];
  readonly clientId?: string;
  readonly driverId?: string;
  readonly vehicleId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly search?: string;
  readonly minProfit?: number; // NUEVO: Filtrar por rentabilidad mínima
  readonly maxProfit?: number; // NUEVO: Filtrar por rentabilidad máxima
}

/**
 * Opciones de ordenamiento
 */
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

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Parámetros de consulta completos
 */
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

/**
 * Matriz de transiciones válidas de estado
 * Define qué estados pueden pasar a qué otros estados
 */
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

/**
 * Tipos de parada que solo pueden existir una vez por viaje
 */
export const UNIQUE_STOP_TYPES: readonly StopTypeValue[] = [
  StopType.ORIGIN,
  StopType.DESTINATION,
] as const;

/**
 * Etiquetas de estado para UI
 */
export const TRIP_STATUS_LABELS: Record<TripStatusType, string> = {
  [TripStatus.DRAFT]: "Borrador",
  [TripStatus.SCHEDULED]: "Programado",
  [TripStatus.IN_PROGRESS]: "En Curso",
  [TripStatus.COMPLETED]: "Completado",
  [TripStatus.CANCELLED]: "Cancelado",
};

/**
 * Etiquetas de tipo de parada para UI
 */
export const STOP_TYPE_LABELS: Record<StopTypeValue, string> = {
  [StopType.ORIGIN]: "Origen",
  [StopType.PICKUP]: "Carga",
  [StopType.DELIVERY]: "Descarga",
  [StopType.WAYPOINT]: "Escala",
  [StopType.DESTINATION]: "Destino",
};

/**
 * Etiquetas de estado de parada para UI
 */
export const STOP_STATUS_LABELS: Record<StopStatusValue, string> = {
  [StopStatus.PENDING]: "Pendiente",
  [StopStatus.IN_PROGRESS]: "En Progreso",
  [StopStatus.COMPLETED]: "Completado",
  [StopStatus.SKIPPED]: "Omitido",
};

/**
 * Etiquetas de categoría de gasto para UI
 */
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

/**
 * Etiquetas de estado de gasto para UI
 */
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatusType, string> = {
  [ExpenseStatus.PENDING]: "Pendiente",
  [ExpenseStatus.DOCUMENTED]: "Documentado",
  [ExpenseStatus.APPROVED]: "Aprobado",
  [ExpenseStatus.REJECTED]: "Rechazado",
};

/**
 * Etiquetas de acción de carga para UI
 */
export const CARGO_ACTION_LABELS: Record<CargoActionType, string> = {
  [CargoAction.PICKUP]: "Recoger",
  [CargoAction.DELIVERY]: "Entregar",
  [CargoAction.PARTIAL_DELIVERY]: "Entrega Parcial",
};

/**
 * Etiquetas de estado de carga para UI
 */
export const CARGO_STATUS_LABELS: Record<CargoStatusType, string> = {
  [CargoStatus.PENDING]: "Pendiente",
  [CargoStatus.IN_TRANSIT]: "En Tránsito",
  [CargoStatus.DELIVERED]: "Entregada",
  [CargoStatus.RETURNED]: "Devuelta",
  [CargoStatus.CANCELLED]: "Cancelada",
};

/**
 * Iconos sugeridos para categorías de gasto
 */
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

/**
 * Colores para categorías de gasto (para gráficos)
 */
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategoryType, string> = {
  [ExpenseCategory.FUEL]: "#ef4444", // red
  [ExpenseCategory.TOLLS]: "#f97316", // orange
  [ExpenseCategory.DRIVER_ALLOWANCE]: "#eab308", // yellow
  [ExpenseCategory.LODGING]: "#22c55e", // green
  [ExpenseCategory.LOADING_UNLOADING]: "#14b8a6", // teal
  [ExpenseCategory.PARKING]: "#3b82f6", // blue
  [ExpenseCategory.MAINTENANCE]: "#8b5cf6", // violet
  [ExpenseCategory.INSURANCE]: "#ec4899", // pink
  [ExpenseCategory.PERMITS]: "#6b7280", // gray
  [ExpenseCategory.OTHER]: "#a3a3a3", // neutral
};
