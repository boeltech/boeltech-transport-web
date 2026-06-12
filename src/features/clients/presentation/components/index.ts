/**
 * Client Components - Barrel Exports
 * Clean Architecture - Presentation Layer
 *
 * Exporta todos los componentes del módulo de clientes.
 *
 * Ubicación: src/features/clients/presentation/components/index.ts
 */

// Client components
export { ClientTable } from "./ClientTable";
export { ClientCard } from "./ClientCard";
export { ClientCardSkeleton } from "./ClientCardSkeleton";
export { ClientForm } from "./ClientForm";
export { ClientActions } from "./ClientActions";
export { ClientDetailDataTab } from "./ClientDetailDataTab";
export { ClientDetailCommercialTab } from "./ClientDetailCommercialTab";

// Contact components (WS-B)
export { ClientContactForm } from "./ClientContactForm";
export { ClientContactListRow } from "./ClientContactListRow";
export { ClientContactDetailView } from "./ClientContactDetailView";
export { ClientContactsMasterDetail } from "./ClientContactsMasterDetail";
export { ClientTripHistoryTab } from "./ClientTripHistoryTab";

// Address components
export { ClientAddressCard } from "./ClientAddressCard";
export { ClientAddressForm } from "./ClientAddressForm";
export { ClientAddressListRow } from "./ClientAddressListItem";
export { ClientAddressDetailView } from "./ClientAddressDetailView";
export { ClientAddressMasterDetail } from "./ClientAddressMasterDetail";
export { ClientCreateReviewSummary } from "./ClientCreateReviewSummary";

// Types
export type { ClientFormProps, ClientFormRef } from "./ClientForm";
export type { ClientAddressFormRef } from "./ClientAddressForm";
export type { ClientAddressFormProps } from "./ClientAddressForm";
export type { ClientAddressListRowProps } from "./ClientAddressListItem";
export type { ClientAddressDetailViewProps } from "./ClientAddressDetailView";
export type { ClientAddressMasterDetailProps } from "./ClientAddressMasterDetail";
export type { ClientContactFormProps, ClientContactFormRef } from "./ClientContactForm";
export type { ClientContactListRowProps } from "./ClientContactListRow";
export type { ClientContactDetailViewProps } from "./ClientContactDetailView";
export type { ClientContactsMasterDetailProps } from "./ClientContactsMasterDetail";
