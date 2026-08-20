import { describe, expect, it } from "vitest";

import {
  TrailerStatus,
  TRAILER_STATUS_LABELS,
  classifyTrailerForAssignment,
  type TrailerListItem,
} from "@features/trailers";

function trailer(
  overrides: Partial<TrailerListItem> & Pick<TrailerListItem, "id">,
): TrailerListItem {
  return {
    tenantId: "tenant-1",
    licensePlate: "12MN4P6",
    satSubTipoRemCode: "CTR003",
    status: TrailerStatus.AVAILABLE,
    branchId: null,
    isActive: true,
    notes: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

describe("classifyTrailerForAssignment", () => {
  it("allows an available active trailer", () => {
    const result = classifyTrailerForAssignment(trailer({ id: "trl-ok" }));
    expect(result.canBeAssigned).toBe(true);
  });

  it("blocks a reserved trailer held by a scheduled trip", () => {
    const result = classifyTrailerForAssignment(
      trailer({ id: "trl-reserved", status: TrailerStatus.RESERVED }),
    );
    expect(result).toMatchObject({
      canBeAssigned: false,
      blockReason: TRAILER_STATUS_LABELS[TrailerStatus.RESERVED],
    });
  });

  it("blocks a trailer already on a trip", () => {
    const result = classifyTrailerForAssignment(
      trailer({ id: "trl-trip", status: TrailerStatus.ON_TRIP }),
    );
    expect(result).toMatchObject({
      canBeAssigned: false,
      blockReason: TRAILER_STATUS_LABELS[TrailerStatus.ON_TRIP],
    });
  });

  it("blocks out of service and inactive trailers", () => {
    expect(
      classifyTrailerForAssignment(
        trailer({ id: "trl-oos", status: TrailerStatus.OUT_OF_SERVICE }),
      ),
    ).toMatchObject({
      canBeAssigned: false,
      blockReason: "Fuera de servicio",
    });
    expect(
      classifyTrailerForAssignment(trailer({ id: "trl-off", isActive: false })),
    ).toMatchObject({
      canBeAssigned: false,
      blockReason: "Remolque inactivo",
    });
  });
});
