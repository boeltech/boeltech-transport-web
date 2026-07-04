import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/core";
import {
  scrubSentryEvent,
  shouldCaptureApiStatus,
} from "./sentry-scrub";
import { initSentry, isSentryEnabled } from "./sentry";

describe("shouldCaptureApiStatus", () => {
  it("captures only 5xx responses", () => {
    expect(shouldCaptureApiStatus(500)).toBe(true);
    expect(shouldCaptureApiStatus(503)).toBe(true);
    expect(shouldCaptureApiStatus(422)).toBe(false);
    expect(shouldCaptureApiStatus(404)).toBe(false);
    expect(shouldCaptureApiStatus(undefined)).toBe(false);
  });
});

describe("scrubSentryEvent (web)", () => {
  it("filters authorization headers in breadcrumbs", () => {
    const event = {
      breadcrumbs: [
        {
          category: "xhr",
          data: {
            Authorization: "Bearer secret",
            url: "/api/v1/invoices",
          },
        },
      ],
    } as unknown as ErrorEvent;

    const scrubbed = scrubSentryEvent(event);
    expect(
      (scrubbed?.breadcrumbs?.[0]?.data as Record<string, string>).Authorization,
    ).toBe("[Filtered]");
  });
});

describe("initSentry (web)", () => {
  it("is no-op when observability is disabled in test env", () => {
    expect(initSentry()).toBe(false);
    expect(isSentryEnabled()).toBe(false);
  });
});
