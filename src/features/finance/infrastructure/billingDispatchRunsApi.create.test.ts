import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      getAxiosInstance: () => ({ post: postMock }),
    },
  };
});

import { createBillingDispatchRun } from "./billingDispatchRunsApi";

const runRaw = {
  data: {
    id: "run-1",
    tenant_id: "t1",
    billing_scheme_id: "scheme-1",
    period_start: "2026-04-18T06:00:00.000Z",
    period_end: "2026-04-25T06:00:00.000Z",
    anchor_kind: "trip_completed",
    origin: "manual",
    status: "previewed",
    previewed_at: "2026-04-25T12:00:00.000Z",
    send_confirmed_at: null,
    send_confirmed_by: null,
    completed_at: null,
    failed_at: null,
    error_summary: null,
    created_by: "u1",
    created_at: "2026-04-25T12:00:00.000Z",
    updated_at: "2026-04-25T12:00:00.000Z",
    window_kind: "calendar_cut",
    cadence_kind: "periodic_weekly",
    inclusive_start: "2026-04-18",
    inclusive_end: "2026-04-24",
    cut_date: "2026-04-25",
    window_hours: null,
  },
  message: "ok",
};

describe("createBillingDispatchRun status", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("marks reused when the API returns 200", async () => {
    postMock.mockResolvedValue({ status: 200, data: runRaw });

    const result = await createBillingDispatchRun({
      billingSchemeId: "scheme-1",
      autoPreview: true,
    });

    expect(postMock).toHaveBeenCalledWith("/billing-dispatch-runs", {
      billing_scheme_id: "scheme-1",
      auto_preview: true,
    });
    expect(result.reused).toBe(true);
    expect(result.run.id).toBe("run-1");
    expect(result.run.inclusiveStart).toBe("2026-04-18");
  });

  it("marks created when the API returns 201", async () => {
    postMock.mockResolvedValue({ status: 201, data: runRaw });

    const result = await createBillingDispatchRun({
      billingSchemeId: "scheme-1",
    });

    expect(result.reused).toBe(false);
    expect(postMock.mock.calls[0]?.[1]).not.toHaveProperty("reference_at");
  });
});
