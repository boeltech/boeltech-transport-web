import { describe, expect, it } from "vitest";
import { BranchStatus } from "../domain";
import {
  mapBranchCapacityMeta,
  mapBranchReconcilePreview,
  mapPaginatedBranches,
  mapSingleBranch,
  toApiCreateBranch,
  toApiUpdateBranch,
  type ApiBranchListItemResponse,
  type ApiBranchReconcilePreview,
  type ApiBranchResponse,
} from "./mappers";

const apiBranchAddress = {
  id: "addr-1",
  street: "Av. Principal",
  exterior_number: "100",
  interior_number: null,
  neighborhood_name: "Centro",
  reference: null,
  city: "Monterrey",
  state: "Nuevo León",
  country: "México",
  postal_code: "64000",
  sat_country_code: "MEX",
  sat_state_code: "19",
  sat_municipality_code: "039",
  sat_locality_code: null,
  locality_name: null,
  sat_neighborhood_code: null,
  latitude: null,
  longitude: null,
  geolocation_pending: true,
  location_name: "Sucursal Monterrey",
};

const apiBranch: ApiBranchResponse = {
  id: "branch-1",
  tenant_id: "tenant-1",
  code: "MTY-01",
  name: "Sucursal Monterrey",
  status: "active",
  is_main: true,
  is_active: true,
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
  address: apiBranchAddress,
};

describe("mapSingleBranch", () => {
  it("maps nested address from API response to domain Branch", () => {
    const mapped = mapSingleBranch({ data: apiBranch });

    expect(mapped.data.id).toBe("branch-1");
    expect(mapped.data.status).toBe(BranchStatus.ACTIVE);
    expect(mapped.data.isMain).toBe(true);
    expect(mapped.data.address).toMatchObject({
      addressId: "addr-1",
      street: "Av. Principal",
      exteriorNumber: "100",
      postalCode: "64000",
      country: "México",
      satStateCode: "19",
      satMunicipalityCode: "039",
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
  });
});

describe("mapBranchReconcilePreview", () => {
  it("maps capacity meta from snake_case API payload", () => {
    const preview: ApiBranchReconcilePreview = {
      capacity: {
        active_count: 3,
        max_branches: 1,
        limit_reached: true,
        over_quota: true,
        over_quota_count: 2,
        requires_remediation: true,
        plan_eligible_branch_ids: ["branch-main"],
      },
      branches: [
        {
          id: "branch-main",
          code: "QRO-01",
          name: "Matriz",
          is_main: true,
          employee_count: 2,
          is_plan_eligible: true,
          preselected: true,
        },
        {
          id: "branch-2",
          code: "QRO-02",
          name: "Secundaria",
          is_main: false,
          employee_count: 0,
          is_plan_eligible: false,
          preselected: false,
        },
      ],
    };

    const mapped = mapBranchReconcilePreview({ data: preview });

    expect(mapped.data.capacity).toMatchObject({
      activeCount: 3,
      maxBranches: 1,
      overQuota: true,
      planEligibleBranchIds: ["branch-main"],
    });
    expect(mapped.data.branches).toHaveLength(2);
    expect(mapped.data.branches[0]).toMatchObject({
      id: "branch-main",
      isMain: true,
      employeeCount: 2,
      preselected: true,
    });
  });
});

describe("mapBranchCapacityMeta", () => {
  it("maps reconcile response capacity from snake_case", () => {
    const mapped = mapBranchCapacityMeta({
      data: {
        active_count: 1,
        max_branches: 1,
        limit_reached: true,
        over_quota: false,
        over_quota_count: 0,
        requires_remediation: false,
        plan_eligible_branch_ids: ["branch-main"],
      },
    });

    expect(mapped.data.maxBranches).toBe(1);
    expect(mapped.data.overQuota).toBe(false);
  });
});

describe("toApiCreateBranch", () => {
  it("maps create DTO to nested snake_case payload", () => {
    const payload = toApiCreateBranch({
      code: "MTY-01",
      name: "Sucursal Monterrey",
      status: BranchStatus.ACTIVE,
      isMain: true,
      address: {
        street: "Av. Principal",
        postal_code: "64000",
        sat_country_code: "MEX",
        sat_state_code: "19",
        location_name: "Sucursal Monterrey",
      },
      managerName: "Ana Pérez",
    });

    expect(payload).toEqual({
      code: "MTY-01",
      name: "Sucursal Monterrey",
      status: BranchStatus.ACTIVE,
      is_main: true,
      phone: undefined,
      email: undefined,
      manager_name: "Ana Pérez",
      notes: undefined,
      address: {
        street: "Av. Principal",
        postal_code: "64000",
        sat_country_code: "MEX",
        sat_state_code: "19",
        location_name: "Sucursal Monterrey",
      },
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
