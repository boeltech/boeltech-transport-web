import { describe, expect, it } from "vitest";
import { TrailerStatus, type Trailer } from "@features/trailers";
import {
  buildCreateTrailerPayload,
  buildUpdateTrailerPayload,
} from "./trailerFormPayload";
import type { CreateTrailerFormData } from "./validation";

const formData: CreateTrailerFormData = {
  licensePlate: "REM1234",
  satSubTipoRemCode: "CTR001",
  notes: "  lona rota  ",
  branchId: "11111111-1111-4111-8111-111111111111",
};

const trailer: Trailer = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  tenantId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  licensePlate: "OLD1234",
  satSubTipoRemCode: "CTR002",
  status: TrailerStatus.AVAILABLE,
  branchId: "22222222-2222-4222-8222-222222222222",
  isActive: true,
  notes: "prev",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  createdBy: null,
  updatedBy: null,
};

describe("buildCreateTrailerPayload", () => {
  it("sends branchId null even if the form had a value", () => {
    expect(buildCreateTrailerPayload(formData)).toEqual({
      licensePlate: "REM1234",
      satSubTipoRemCode: "CTR001",
      notes: "lona rota",
      branchId: null,
    });
  });
});

describe("buildUpdateTrailerPayload", () => {
  it("preserves the entity branchId and does not use the form value", () => {
    expect(buildUpdateTrailerPayload(formData, trailer)).toEqual({
      licensePlate: "REM1234",
      satSubTipoRemCode: "CTR001",
      notes: "lona rota",
      branchId: trailer.branchId,
    });
  });

  it("keeps a null branchId from the entity", () => {
    const payload = buildUpdateTrailerPayload(formData, {
      ...trailer,
      branchId: null,
    });
    expect(payload.branchId).toBeNull();
  });
});
