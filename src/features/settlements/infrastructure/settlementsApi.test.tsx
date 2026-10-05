import { beforeEach, describe, expect, it, vi } from "vitest";

import { deepToSnake } from "@shared/api/utils/case-transformer";

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      post: postMock,
    },
  };
});

import { settlementsApi } from "./settlementsApi";

describe("settlementsApi.disburseSettlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postMock.mockResolvedValue({
      data: {
        id: "settlement-1",
        settlement_number: "LIQ-202608-0003",
        status: "disbursed",
        approval_revision: "rev-2",
      },
    });
  });

  it("D27: siempre envía expected_revision y sobrevive a la conversión a snake_case", async () => {
    const result = await settlementsApi.disburseSettlement(
      "settlement-1",
      {
        disbursementMethod: "bank_transfer",
        disbursementReference: "SPEI-998823",
        disbursedAt: "2026-08-31T18:00:00.000Z",
        notes: "  ",
      },
      "rev-1",
    );

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, body] = postMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe("/settlements/settlement-1/disburse");
    expect(body.expected_revision).toBe("rev-1");
    expect(body).not.toHaveProperty("expectedRevision");
    expect(body.notes).toBeUndefined();

    const wireBody = deepToSnake(body) as Record<string, unknown>;
    expect(wireBody).toEqual({
      disbursement_method: "bank_transfer",
      disbursement_reference: "SPEI-998823",
      disbursed_at: "2026-08-31T18:00:00.000Z",
      notes: undefined,
      expected_revision: "rev-1",
    });

    expect(result.id).toBe("settlement-1");
    expect(result.approvalRevision).toBe("rev-2");
  });
});
