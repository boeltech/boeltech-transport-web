/**
 * Clients Feature - Public API
 * FSD: Features Layer
 *
 */

// Hooks
export {
  useClients,
  useActiveClients,
  clientKeys,
  fetchClients,
} from "./hooks/useClients";

// Types
export type {
  ClientListItem,
  ClientFilters,
  ClientType,
  PaymentTerms,
} from "./hooks/useClients";
