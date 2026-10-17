import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockIsSentryEnabled, mockAddBreadcrumb } = vi.hoisted(() => ({
  mockIsSentryEnabled: vi.fn(() => false),
  mockAddBreadcrumb: vi.fn(),
}));

vi.mock("@shared/observability/sentry", () => ({
  isSentryEnabled: () => mockIsSentryEnabled(),
}));

vi.mock("@sentry/react", () => ({
  addBreadcrumb: (...args: unknown[]) => mockAddBreadcrumb(...args),
}));

import {
  resetActivationEventOnceKeysForTests,
  trackActivationEvent,
} from "./trackActivationEvent";

describe("trackActivationEvent", () => {
  beforeEach(() => {
    resetActivationEventOnceKeysForTests();
    mockIsSentryEnabled.mockReturnValue(false);
    mockAddBreadcrumb.mockClear();
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs structured debug in DEV without throwing", () => {
    trackActivationEvent("activation_checklist_viewed", { mode: "full" });

    if (import.meta.env.DEV) {
      expect(console.debug).toHaveBeenCalledWith(
        "[activation]",
        "activation_checklist_viewed",
        { mode: "full" },
      );
    }
    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });

  it("adds Sentry breadcrumb when Sentry is enabled", () => {
    mockIsSentryEnabled.mockReturnValue(true);

    trackActivationEvent("activation_demo_seed_loaded", { pack: "ops" });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "activation",
        message: "activation_demo_seed_loaded",
        level: "info",
        data: { pack: "ops" },
      }),
    );
  });

  it("dedupes with onceKey in the same session", () => {
    mockIsSentryEnabled.mockReturnValue(true);

    trackActivationEvent(
      "activation_checklist_viewed",
      { n: 1 },
      { onceKey: "tenant-1:user-1" },
    );
    trackActivationEvent(
      "activation_checklist_viewed",
      { n: 2 },
      { onceKey: "tenant-1:user-1" },
    );

    expect(mockAddBreadcrumb).toHaveBeenCalledTimes(1);
  });
});
