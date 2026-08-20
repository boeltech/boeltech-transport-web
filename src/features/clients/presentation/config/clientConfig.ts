/**
 * Client UI Configuration
 * Clean Architecture - Presentation Layer
 *
 * Configuración de UI para el módulo de clientes:
 * badges, colores, iconos, etc.
 *
 * Ubicación: src/features/clients/presentation/config/clientConfig.ts
 */

import {
  Building2,
  User,
  CreditCard,
  Banknote,
  MapPin,
  Truck,
  Package,
  Warehouse,
  Building,
  CheckCircle2,
  MinusCircle,
  Navigation,
  Flag,
  CircleDot,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { ClientType, PaymentTerms, AddressType } from "../../domain";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";

// ============================================================================
// CLIENT TYPE CONFIG
// ============================================================================

export interface ClientTypeConfig {
  label: string;
  labelShort: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "outline";
  color: string;
  bgColor: string;
}

export const CLIENT_TYPE_CONFIG: Record<ClientType, ClientTypeConfig> = {
  company: {
    label: "Persona Moral",
    labelShort: "Moral",
    icon: Building2,
    variant: "default",
    color: "text-info-soft-foreground",
    bgColor: "bg-info-soft",
  },
  individual: {
    label: "Persona Física",
    labelShort: "Física",
    icon: User,
    variant: "secondary",
    color: "text-success-soft-foreground",
    bgColor: "bg-success-soft",
  },
};

// ============================================================================
// PAYMENT TERMS CONFIG
// ============================================================================

export interface PaymentTermsConfig {
  label: string;
  labelShort: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "outline" | "destructive";
  color: string;
}

export const PAYMENT_TERMS_CONFIG: Record<PaymentTerms, PaymentTermsConfig> = {
  cash: {
    label: "Contado",
    labelShort: "Contado",
    icon: Banknote,
    variant: "outline",
    color: "text-success",
  },
  credit: {
    label: "Crédito",
    labelShort: "Crédito",
    icon: CreditCard,
    variant: "secondary",
    color: "text-info",
  },
};

// ============================================================================
// ADDRESS TYPE CONFIG
// ============================================================================

export interface AddressTypeConfig {
  label: string;
  labelShort: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "outline";
  color: string;
  bgColor: string;
}

export const ADDRESS_TYPE_CONFIG: Record<AddressType, AddressTypeConfig> = {
  billing: {
    label: "Facturación",
    labelShort: "Fiscal",
    icon: Building2,
    variant: "default",
    color: "text-info-soft-foreground",
    bgColor: "bg-info-soft",
  },
  shipping: {
    label: "Envío/Entrega",
    labelShort: "Entrega",
    icon: Truck,
    variant: "secondary",
    color: "text-info-soft-foreground",
    bgColor: "bg-info-soft",
  },
  pickup: {
    label: "Recolección",
    labelShort: "Recolección",
    icon: Package,
    variant: "outline",
    color: "text-warning-soft-foreground",
    bgColor: "bg-warning-soft",
  },
  warehouse: {
    label: "Almacén/Bodega",
    labelShort: "Bodega",
    icon: Warehouse,
    variant: "outline",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  office: {
    label: "Oficina",
    labelShort: "Oficina",
    icon: Building,
    variant: "secondary",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  personal: {
    label: "Personal",
    labelShort: "Personal",
    icon: User,
    variant: "secondary",
    color: "text-neutral-soft-foreground",
    bgColor: "bg-neutral-soft",
  },
  trip_origin: {
    label: "Origen de viaje",
    labelShort: "Origen",
    icon: Navigation,
    variant: "outline",
    color: "text-success-soft-foreground",
    bgColor: "bg-success-soft",
  },
  trip_destination: {
    label: "Destino de viaje",
    labelShort: "Destino",
    icon: Flag,
    variant: "outline",
    color: "text-destructive-soft-foreground",
    bgColor: "bg-destructive-soft",
  },
  trip_stop: {
    label: "Parada de viaje",
    labelShort: "Parada",
    icon: CircleDot,
    variant: "outline",
    color: "text-warning-soft-foreground",
    bgColor: "bg-warning-soft",
  },
  company: {
    label: "Empresa / fiscal",
    labelShort: "Empresa",
    icon: Building2,
    variant: "default",
    color: "text-info-soft-foreground",
    bgColor: "bg-info-soft",
  },
  branch: {
    label: "Sucursal",
    labelShort: "Sucursal",
    icon: Store,
    variant: "outline",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  other: {
    label: "Otro",
    labelShort: "Otro",
    icon: MapPin,
    variant: "outline",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

// ============================================================================
// STATUS CONFIG
// ============================================================================

export interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  color: string;
  icon: LucideIcon;
}

export const CLIENT_STATUS_CONFIG: Record<"active" | "inactive", StatusConfig> =
  {
    active: {
      label: "Activo",
      variant: "default",
      color: "text-success",
      icon: CheckCircle2,
    },
    inactive: {
      label: "Inactivo",
      variant: "secondary",
      color: "text-muted-foreground",
      icon: MinusCircle,
    },
  };

// ============================================================================
// PAGINATION
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// TABLE COLUMNS CONFIG
// ============================================================================

export const CLIENT_TABLE_COLUMNS = [
  { key: "clientCode", label: "Código", sortable: true, width: "w-24" },
  { key: "legalName", label: "Razón Social", sortable: true },
  { key: "taxId", label: "RFC", sortable: false, width: "w-32" },
  { key: "type", label: "Tipo", sortable: true, width: "w-28" },
  { key: "paymentTerms", label: "Pago", sortable: true, width: "w-24" },
  { key: "phone", label: "Teléfono", sortable: false, width: "w-32" },
  { key: "isActive", label: "Estado", sortable: true, width: "w-24" },
  { key: "actions", label: "", sortable: false, width: "w-16" },
] as const;

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const CLIENT_TYPE_OPTIONS = [
  { value: "all", label: "Todos los tipos" },
  { value: "company", label: "Persona Moral" },
  { value: "individual", label: "Persona Física" },
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  { value: "all", label: "Todos los términos" },
  { value: "cash", label: "Contado" },
  { value: "credit", label: "Crédito" },
] as const;

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
] as const;

export const ADDRESS_TYPE_OPTIONS = [
  { value: "billing", label: "Facturación" },
  { value: "shipping", label: "Envío/Entrega" },
  { value: "pickup", label: "Recolección" },
  { value: "warehouse", label: "Almacén/Bodega" },
  { value: "office", label: "Oficina" },
  { value: "other", label: "Otro" },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene la configuración de tipo de cliente
 */
export function getClientTypeConfig(type: ClientType): ClientTypeConfig {
  return CLIENT_TYPE_CONFIG[type];
}

/**
 * Obtiene la configuración de términos de pago
 */
export function getPaymentTermsConfig(terms: PaymentTerms): PaymentTermsConfig {
  return PAYMENT_TERMS_CONFIG[terms];
}

/**
 * Obtiene la configuración de tipo de dirección
 */
export function getAddressTypeConfig(type: AddressType): AddressTypeConfig {
  return ADDRESS_TYPE_CONFIG[type];
}

/**
 * Obtiene la configuración de estado
 */
export function getStatusConfig(isActive: boolean): StatusConfig {
  return CLIENT_STATUS_CONFIG[isActive ? "active" : "inactive"];
}

/**
 * Formatea el límite de crédito
 */
export function formatCreditLimit(limit: number | undefined): string {
  if (!limit || limit === 0) return "Sin límite";
  return formatMxCurrencyWhole(limit);
}

/**
 * Formatea los días de crédito
 */
export function formatCreditDays(days: number): string {
  if (days === 0) return "N/A";
  return `${days} días`;
}

// ============================================================================
// CLIENT ADDRESS — DATOS FISCALES OPERATIVOS (CARTA PORTE)
// ============================================================================

export const CLIENT_ADDRESS_FISCAL_COPY = {
  sectionTitle: "RFC de esta ubicación",
  hint:
    "RFC y nombre del remitente o destinatario en este lugar de viaje. Se copian al snapshot de la parada al timbrar Carta Porte. No sustituyen el RFC del cliente receptor.",
  rfcLabel: "RFC remitente/destinatario",
  rfcPlaceholder: "Ej. XAXX010101000",
  nombreLabel: "Nombre o razón social",
  nombrePlaceholder: "Como aparece ante el SAT",
  useClientData: "Usar datos fiscales del cliente",
} as const;
