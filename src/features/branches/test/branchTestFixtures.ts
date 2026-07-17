import {
  BranchStatus,
  type Branch,
  type BranchListItem,
  type BranchListMeta,
  type BranchManagementEvent,
} from "../domain";
import type { BranchEmployeeListItem } from "../infrastructure/branchEmployeesApi";
import {
  VehicleStatus,
  VehicleType,
  type VehicleListItem,
} from "@features/vehicles/domain";

export const BRANCH_TEST_IDS = {
  main: "11111111-1111-4111-8111-111111111111",
  secondary: "22222222-2222-4222-8222-222222222222",
  deleted: "33333333-3333-4333-8333-333333333333",
  employee: "44444444-4444-4444-8444-444444444444",
  vehicle: "66666666-6666-4666-8666-666666666666",
} as const;

const NOW = new Date("2026-07-07T17:11:14.081Z");

export function buildBranchListMeta(
  overrides: Partial<BranchListMeta> = {},
): BranchListMeta {
  return {
    activeCount: 1,
    maxBranches: 3,
    limitReached: false,
    overQuota: false,
    overQuotaCount: 0,
    requiresRemediation: false,
    planEligibleBranchIds: [],
    ...overrides,
  };
}

export function buildBranchListItem(
  overrides: Partial<BranchListItem> = {},
): BranchListItem {
  return {
    id: BRANCH_TEST_IDS.secondary,
    code: "QRO-02",
    name: "Sucursal Secundaria",
    status: BranchStatus.ACTIVE,
    isMain: false,
    city: "El Marqués",
    state: "Querétaro",
    phone: "5546985745",
    isActive: true,
    createdAt: NOW,
    ...overrides,
  };
}

export function buildBranch(overrides: Partial<Branch> = {}): Branch {
  const listItem = buildBranchListItem(overrides);
  return {
    id: listItem.id,
    tenantId: "tenant-1",
    code: listItem.code,
    name: listItem.name,
    status: listItem.status,
    isMain: listItem.isMain,
    isActive: listItem.isActive,
    address: {
      addressId: "addr-1",
      street: "Av. Principal",
      exteriorNumber: "9",
      interiorNumber: null,
      neighborhood: null,
      city: listItem.city,
      state: listItem.state,
      postalCode: "76246",
      country: "Mexico",
      satCountryCode: "MEX",
      satStateCode: "QUE",
      satMunicipalityCode: null,
      localityName: null,
      geolocationPending: true,
      locationName: listItem.name,
    },
    contact: {
      phone: listItem.phone,
      email: "sucursal@boeltech.com",
      managerName: "King Kong",
    },
    notes: null,
    createdAt: listItem.createdAt,
    updatedAt: listItem.createdAt,
    createdBy: "user-1",
    updatedBy: "user-1",
    createdByName: "Admin",
    updatedByName: "Admin",
    ...overrides,
  };
}

export function buildMainBranchListItem(): BranchListItem {
  return buildBranchListItem({
    id: BRANCH_TEST_IDS.main,
    code: "QRO-01",
    name: "Sucursal El Marqués",
    isMain: true,
    city: "El Marqués",
    state: "Querétaro",
  });
}

export function buildDeletedBranchListItem(): BranchListItem {
  return buildBranchListItem({
    id: BRANCH_TEST_IDS.deleted,
    code: "DEL-01",
    name: "Sucursal Eliminada",
    isMain: false,
    isActive: false,
    status: BranchStatus.INACTIVE,
    city: "Querétaro",
    state: "Querétaro",
    phone: null,
  });
}

export function buildBranchEmployee(
  overrides: Partial<BranchEmployeeListItem> = {},
): BranchEmployeeListItem {
  return {
    id: BRANCH_TEST_IDS.employee,
    employeeNumber: "EMP-001",
    fullName: "Juan Pérez",
    department: "Operaciones",
    position: "Chofer",
    status: "active",
    ...overrides,
  };
}

export function buildBranchVehicle(
  overrides: Partial<VehicleListItem> = {},
): VehicleListItem {
  return {
    id: BRANCH_TEST_IDS.vehicle,
    unitNumber: "ECO-01",
    licensePlate: "ABC-123-D",
    brand: "Kenworth",
    model: "T680",
    year: 2022,
    type: VehicleType.TRUCK,
    color: "Blanco",
    status: VehicleStatus.AVAILABLE,
    currentMileage: 12000,
    isActive: true,
    insurancePolicy: null,
    insuranceExpiry: null,
    sctPermitNumber: null,
    sctPermitExpiry: null,
    satTipoPermisoCode: null,
    satConfigAutotransporteCode: null,
    branchId: BRANCH_TEST_IDS.secondary,
    branchName: "Sucursal Secundaria",
    branchCode: "QRO-02",
    ...overrides,
  };
}

export const GEOLOCATED_BRANCH_COORDS = {
  latitude: 20.9938,
  longitude: -100.7461,
  geolocationPending: false,
} as const;

export function buildGeolocatedBranch(
  overrides: Partial<Branch> = {},
): Branch {
  const base = buildBranch(overrides);
  return {
    ...base,
    ...overrides,
    address: {
      ...base.address,
      ...GEOLOCATED_BRANCH_COORDS,
      ...(overrides.address ?? {}),
    },
  };
}

export function buildBranchManagementEvent(
  overrides: Partial<BranchManagementEvent> = {},
): BranchManagementEvent {
  return {
    id: "event-1",
    branchId: BRANCH_TEST_IDS.secondary,
    actorUserId: "user-1",
    actorEmail: "admin@boeltech.com",
    actorFirstName: "Admin",
    actorLastName: "User",
    action: "branch_updated",
    payload: {
      code: "QRO-02",
      name: "Sucursal Secundaria",
      fields: ["name"],
    },
    createdAt: "2026-07-07T18:00:00.000Z",
    ...overrides,
  };
}
