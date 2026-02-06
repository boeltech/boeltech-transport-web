/**
 * Client Domain Entities
 * Clean Architecture - Domain Layer
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
// ENUMS - Tipos enumerados del dominio
// ============================================================================

/**
 * Tipo de cliente
 */
export const ClientType = {
  INDIVIDUAL: "individual",
  COMPANY: "company",
} as const;

export type ClientTypeValue = (typeof ClientType)[keyof typeof ClientType];

/**
 * Términos de pago
 */
export const PaymentTerms = {
  CASH: "cash",
  CREDIT: "credit",
  PREPAID: "prepaid",
} as const;

export type PaymentTermsValue =
  (typeof PaymentTerms)[keyof typeof PaymentTerms];

/**
 * Tipo de dirección
 */
export const AddressType = {
  BILLING: "billing", // Facturación
  SHIPPING: "shipping", // Envío/Entrega
  PICKUP: "pickup", // Recolección
  WAREHOUSE: "warehouse", // Almacén/Bodega
  OFFICE: "office", // Oficina
  OTHER: "other", // Otro
} as const;

export type AddressTypeValue = (typeof AddressType)[keyof typeof AddressType];

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * Entidad: Dirección de Cliente
 * Representa una dirección asociada a un cliente
 */
export interface ClientAddress {
  readonly id: string;
  readonly tenantId: string;
  readonly clientId: string;
  readonly addressType: AddressTypeValue;
  readonly isPrimary: boolean; // Dirección principal
  readonly isActive: boolean;

  // Información de la dirección
  readonly locationName: string | null; // Nombre del lugar (ej: "Bodega Central")
  readonly address: string; // Calle, número, colonia
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly country: string; // Default: "México"

  // Coordenadas (opcional)
  readonly latitude: number | null;
  readonly longitude: number | null;

  // Información de contacto en esta dirección
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly contactEmail: string | null;

  // Horarios y notas
  readonly businessHours: string | null; // Ej: "Lun-Vie 8:00-17:00"
  readonly notes: string | null;
  readonly specialInstructions: string | null; // Instrucciones especiales de acceso

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

/**
 * Entidad: Cliente (referencia básica)
 */
export interface Client {
  readonly id: string;
  readonly tenantId: string;
  readonly clientCode: string;
  readonly legalName: string;
  readonly tradeName: string | null;
  readonly taxId: string;
  readonly type: ClientTypeValue;
  readonly paymentTerms: PaymentTermsValue;
  readonly creditDays: number;
  readonly creditLimit: number | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Relaciones (opcionales, cuando se cargan con detalle)
  readonly addresses?: ClientAddress[];
}

/**
 * Entidad: Cliente con direcciones
 */
export interface ClientWithAddresses extends Client {
  readonly addresses: ClientAddress[];
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Dirección simplificada para listados
 */
export interface ClientAddressListItem {
  readonly id: string;
  readonly addressType: AddressTypeValue;
  readonly isPrimary: boolean;
  readonly locationName: string | null;
  readonly address: string;
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
}

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

/**
 * Etiquetas de tipo de dirección para UI
 */
export const ADDRESS_TYPE_LABELS: Record<AddressTypeValue, string> = {
  [AddressType.BILLING]: "Facturación",
  [AddressType.SHIPPING]: "Envío/Entrega",
  [AddressType.PICKUP]: "Recolección",
  [AddressType.WAREHOUSE]: "Almacén/Bodega",
  [AddressType.OFFICE]: "Oficina",
  [AddressType.OTHER]: "Otro",
};

/**
 * Etiquetas de tipo de cliente para UI
 */
export const CLIENT_TYPE_LABELS: Record<ClientTypeValue, string> = {
  [ClientType.INDIVIDUAL]: "Persona Física",
  [ClientType.COMPANY]: "Persona Moral",
};

/**
 * Etiquetas de términos de pago para UI
 */
export const PAYMENT_TERMS_LABELS: Record<PaymentTermsValue, string> = {
  [PaymentTerms.CASH]: "Contado",
  [PaymentTerms.CREDIT]: "Crédito",
  [PaymentTerms.PREPAID]: "Prepago",
};
