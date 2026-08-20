/**
 * Trailers feature — public barrel (ADR-0077).
 * Import only via `@features/trailers`.
 */

export {
  TrailerStatus,
  TRAILER_STATUS_LABELS,
  trailerQueryKeys,
  type TrailerStatusType,
  type Trailer,
  type TrailerListItem,
  type AssignableTrailerItem,
  type CreateTrailerPayload,
  type UpdateTrailerPayload,
  type TrailerQueryParams,
} from "./domain";

export {
  useAssignableTrailers,
  useCreateTrailer,
  useDeleteTrailer,
  useTrailer,
  useTrailers,
  useUpdateTrailer,
  useUpdateTrailerStatus,
  classifyTrailerForAssignment,
} from "./application";

export { trailersApi } from "./infrastructure";

export {
  TrailerListPage,
  CreateTrailerPage,
  EditTrailerPage,
  TrailerDetailPage,
  TrailerForm,
  CreateTrailerSheet,
  TrailerStatusBadge,
  TRAILER_STATUS_CONFIG,
  trailersCopy,
  createTrailerFormSchema,
  type CreateTrailerFormData,
} from "./presentation";
