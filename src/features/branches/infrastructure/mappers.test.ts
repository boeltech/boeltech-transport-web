import { describe, expect, it } from "vitest";
import { BranchStatus } from "../domain";
import {
  mapPaginatedBranches,
  mapSingleBranch,
  toApiCreateBranch,
  toApiUpdateBranch,
  type ApiBranchListItemResponse,
  type ApiBranchResponse,
} from "./mappers";

const apiBranch: ApiBranchResponse = {
  id: "branch-1",
  tenant_id: "tenant-1",
  code: "MTY-01",
  name: "Sucursal Monterrey",
  status: "active",
  is_main: true,
  is_active: true,
  street: "Av. Principal",
  exterior_number: "100",
  interior_number: null,
  neighborhood: "Centro",
  city: "Monterrey",
  state: "Nuevo León",
  postal_code: "64000",
  country: "México",
  phone: "8181818181",
  email: "sucursal@empresa.com",
  manager_name: "Ana Pérez",
  notes: "Notas",
  created_at: "2026-06-01T12:00:00.000Z",
  updated_at: "2026-06-02T12:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-2",
  created_by_name: "Admin User",
  updated_by_name: "Manager User",
};

describe("mapSingleBranch", () => {
  it("maps snake_case API response to domain Branch", () => {
    const mapped = mapSingleBranch({ data: apiBranch });

    expect(mapped.data.id).toBe("branch-1");
    expect(mapped.data.status).toBe(BranchStatus.ACTIVE);
    expect(mapped.data.isMain).toBe(true);
    expect(mapped.data.address).toMatchObject({
      street: "Av. Principal",
      exteriorNumber: "100",
      postalCode: "64000",
      country: "México",
    });
    expect(mapped.data.contact).toMatchObject({
      phone: "8181818181",
      email: "sucursal@empresa.com",
      managerName: "Ana Pérez",
    });
    expect(mapped.data.createdAt).toBeInstanceOf(Date);
    expect(mapped.data.createdByName).toBe("Admin User");
  });
});

describe("mapPaginatedBranches", () => {
  it("maps paginated list items", () => {
    const listItem: ApiBranchListItemResponse = {
      id: "branch-1",
      code: "MTY-01",
      name: "Sucursal Monterrey",
      status: "active",
      is_main: false,
      city: "Monterrey",
      state: "Nuevo León",
      phone: null,
      is_active: true,
      created_at: "2026-06-01T12:00:00.000Z",
    };

    const mapped = mapPaginatedBranches({
      data: [listItem],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    });

    expect(mapped.data).toHaveLength(1);
    expect(mapped.data[0]).toMatchObject({
      id: "branch-1",
      code: "MTY-01",
      isMain: false,
      isActive: true,
    });
    expect(mapped.pagination.total).toBe(1);
  });
});

describe("toApiCreateBranch", () => {
  it("maps create DTO to snake_case payload", () => {
    const payload = toApiCreateBranch({
      code: "MTY-01",
      name: "Sucursal Monterrey",
      status: BranchStatus.ACTIVE,
      isMain: true,
      street: "Av. Principal",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
      country: "México",
      managerName: "Ana Pérez",
    });

    expect(payload).toEqual({
      code: "MTY-01",
      name: "Sucursal Monterrey",
      status: BranchStatus.ACTIVE,
      is_main: true,
      street: "Av. Principal",
      exterior_number: undefined,
      interior_number: undefined,
      neighborhood: undefined,
      city: "Monterrey",
      state: "Nuevo León",
      postal_code: "64000",
      country: "México",
      phone: undefined,
      email: undefined,
      manager_name: "Ana Pérez",
      notes: undefined,
    });
  });
});

describe("toApiUpdateBranch", () => {
  it("includes only defined fields in sparse update payload", () => {
    const payload = toApiUpdateBranch({
      name: "Sucursal actualizada",
      phone: null,
      isActive: false,
    });

    expect(payload).toEqual({
      name: "Sucursal actualizada",
      phone: null,
      is_active: false,
    });
  });
});
