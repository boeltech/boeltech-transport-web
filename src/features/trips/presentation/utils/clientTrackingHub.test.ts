import { describe, expect, it } from "vitest";
import { TripStatus } from "@features/trips/domain";

import { trackingCopy } from "../copy";
import { resolveClientTrackingHubNarrative } from "./clientTrackingHub";

describe("resolveClientTrackingHubNarrative", () => {
  it("narra estado del envío sin Iniciar/Registrar/Completar/falso", () => {
    const scheduled = resolveClientTrackingHubNarrative(TripStatus.SCHEDULED);
    expect(scheduled.title).toBe(trackingCopy.hint.clientScheduledTitle);
    expect(scheduled.body).toMatch(/aún no sale/i);

    const inProgress = resolveClientTrackingHubNarrative(TripStatus.IN_PROGRESS);
    expect(inProgress.title).toBe(trackingCopy.hint.clientInProgressTitle);
    expect(inProgress.body).toMatch(/en camino/i);

    const completed = resolveClientTrackingHubNarrative(TripStatus.COMPLETED);
    expect(completed.title).toBe(trackingCopy.hint.clientCompletedTitle);

    const cancelled = resolveClientTrackingHubNarrative(TripStatus.CANCELLED);
    expect(cancelled.title).toBe(trackingCopy.hint.clientCancelledTitle);

    const all = [scheduled, inProgress, completed, cancelled]
      .map((item) => `${item.title} ${item.body}`)
      .join("\n");
    expect(all).not.toMatch(/Iniciar|Registrar|Completar|falso/i);
  });
});
