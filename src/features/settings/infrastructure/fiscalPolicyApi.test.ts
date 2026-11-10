import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, putMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: getMock,
      put: putMock,
    },
  };
});

import { fiscalPolicyApi } from "./fiscalPolicyApi";

const raw = {
  tenant_id: "tenant-1",
  sin_cfdi_mode: "comercial_only_clients" as const,
  created_at: "2026-11-01T00:00:00.000Z",
  updated_at: "2026-11-02T18:00:00.000Z",
  updated_by: "user-1",
  updated_by_name: "Ana López",
};

describe("fiscalPolicyApi", () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
  });

  it("mapea updatedBy y updatedByName", async () => {
    getMock.mockResolvedValue({ data: raw });
    await expect(fiscalPolicyApi.get()).resolves.toMatchObject({
      tenantId: "tenant-1",
      updatedBy: "user-1",
      updatedByName: "Ana López",
    });
  });

  it("deja updatedBy y updatedByName en null si nadie hizo PUT", async () => {
    getMock.mockResolvedValue({
      data: { ...raw, updated_by: null, updated_by_name: null },
    });
    const policy = await fiscalPolicyApi.get();
    expect(policy.updatedBy).toBeNull();
    expect(policy.updatedByName).toBeNull();
  });

  it("mapea nombre null cuando hay actor sin nombre", async () => {
    putMock.mockResolvedValue({
      data: { ...raw, updated_by_name: null },
    });
    const policy = await fiscalPolicyApi.update("disabled");
    expect(policy.updatedBy).toBe("user-1");
    expect(policy.updatedByName).toBeNull();
  });
});
