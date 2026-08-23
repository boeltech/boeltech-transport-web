import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { Driver, IDriverRepository, UpdateDriverDTO } from "../../domain";
import { UpdateDriverUseCase } from "./UpdateDriverUseCase";

const driverStub = {
  id: "driver-1",
  federalLicenseNumber: "OLD-FED",
  stateLicenseNumber: "OLD-STATE",
} as Driver;

function createRepo(
  overrides: Partial<IDriverRepository> = {},
): IDriverRepository {
  return {
    findById: vi.fn(async () => ({ data: driverStub })),
    update: vi.fn(async (_id, data) => ({
      data: { ...driverStub, ...data } as Driver,
    })),
    existsByLicenseNumber: vi.fn(async () => false),
    ...overrides,
  } as unknown as IDriverRepository;
}

const validUpdate: UpdateDriverDTO = {
  federalLicenseNumber: "NEW-FED",
  federalLicenseCategory: "B",
  federalLicenseExpiry: "2030-01-01",
  stateLicenseNumber: null,
  stateLicenseExpiry: null,
  stateIssuingState: null,
};

describe("UpdateDriverUseCase", () => {
  it("re-lanza ApiError sin envolverlo (paridad create / field errors)", async () => {
    const apiError = new ApiError("Validación", 422, "VALIDATION_ERROR", undefined, [
      { field: "federal_license_number", message: "Licencia duplicada" },
    ]);
    const repo = createRepo({
      update: vi.fn(async () => {
        throw apiError;
      }),
    });
    const useCase = new UpdateDriverUseCase(repo);

    await expect(useCase.execute("driver-1", validUpdate)).rejects.toBe(apiError);
    expect(repo.existsByLicenseNumber).not.toHaveBeenCalled();
  });

  it("no pre-chequea unicidad de licencia (fuente de verdad: API)", async () => {
    const repo = createRepo();
    const useCase = new UpdateDriverUseCase(repo);

    const result = await useCase.execute("driver-1", validUpdate);

    expect(result.success).toBe(true);
    expect(repo.existsByLicenseNumber).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith("driver-1", validUpdate);
  });

  it("rechaza vencimiento federal en el pasado (sync local)", async () => {
    const repo = createRepo();
    const useCase = new UpdateDriverUseCase(repo);

    const result = await useCase.execute("driver-1", {
      ...validUpdate,
      federalLicenseExpiry: "2000-01-01",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("LICENSE_EXPIRED");
    }
    expect(repo.update).not.toHaveBeenCalled();
  });
});
