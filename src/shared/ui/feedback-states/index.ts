/**
 * @shared/ui/feedback-states
 *
 * Estados visuales reutilizables: vacío, no encontrado, cargando.
 * Diseñados para consumo desde los page-shells y desde features puntuales.
 */

export { EmptyState } from "./EmptyState";
export type { EmptyStateCta, EmptyStateProps } from "./EmptyState";

export { NotFoundState } from "./NotFoundState";
export type { NotFoundStateProps } from "./NotFoundState";

export { LoadingPageState } from "./LoadingPageState";
export type {
  LoadingPageStateProps,
  LoadingPageVariant,
} from "./LoadingPageState";
