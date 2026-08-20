import { describe, expect, it } from "vitest";
import { mapTrailerDetail, mapTrailerList, mapTrailerListItem } from "./mappers";

const raw = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  tenant_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  license_plate: "REM1234",
  sat_sub_tipo_rem_code: "CTR001",
  status: "available",
  branch_id: null,
  is_active: true,
  notes: "Pool",
  created_at: "2026-08-01T12:00:00.000Z",
  updated_at: "2026-08-01T12:00:00.000Z",
  created_by: null,
  updated_by: null,
};

describe("mapTrailerListItem", () => {
  it("maps snake_case to camelCase", () => {
    const item = mapTrailerListItem(raw);
    expect(item.id).toBe(raw.id);
    expect(item.licensePlate).toBe("REM1234");
    expect(item.satSubTipoRemCode).toBe("CTR001");
    expect(item.status).toBe("available");
    expect(item.isActive).toBe(true);
    expect(item.tenantId).toBe(raw.tenant_id);
  });
});

describe("mapTrailerDetail", () => {
  it("maps the same shape as list item", () => {
    expect(mapTrailerDetail(raw)).toEqual(mapTrailerListItem(raw));
  });
});

describe("mapTrailerList", () => {
  const listRaw = {
    data: [raw],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };

  it("maps camelCase totalPages from GET /trailers", () => {
    const mapped = mapTrailerList(listRaw);

    expect(mapped.data).toHaveLength(1);
    expect(mapped.data[0].licensePlate).toBe("REM1234");
    expect(mapped.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it("maps snake_case total_pages like other fleet list endpoints", () => {
    const mapped = mapTrailerList({
      data: [raw],
      pagination: {
        page: 1,
        limit: 10,
        total: 11,
        total_pages: 2,
      },
    });

    expect(mapped.pagination.totalPages).toBe(2);
  });
});
