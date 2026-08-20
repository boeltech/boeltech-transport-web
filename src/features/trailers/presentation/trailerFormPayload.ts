import type { CreateTrailerPayload, Trailer, UpdateTrailerPayload } from "../../domain";
import type { CreateTrailerFormData } from "./validation";

export function buildCreateTrailerPayload(
  data: CreateTrailerFormData,
): CreateTrailerPayload {
  return {
    licensePlate: data.licensePlate,
    satSubTipoRemCode: data.satSubTipoRemCode,
    notes: data.notes?.trim() || null,
    branchId: null,
  };
}

export function buildUpdateTrailerPayload(
  data: CreateTrailerFormData,
  trailer: Trailer,
): UpdateTrailerPayload {
  return {
    licensePlate: data.licensePlate,
    satSubTipoRemCode: data.satSubTipoRemCode,
    notes: data.notes?.trim() || null,
    branchId: trailer.branchId,
  };
}
