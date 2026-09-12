import { describe, expect, it, vi } from "vitest";

import type { TripWorkbenchSummary } from "../../domain";
import { TRIP_WORKBENCH_BUCKETS } from "../config/tripWorkbenchConfig";
import { tripsListCopy } from "../copy/listCopy";
import { mapTripWorkbenchBuckets } from "./mapTripWorkbenchBuckets";

const summary: TripWorkbenchSummary = {
  draft: 1,
  scheduled: 2,
  inProgress: 3,
  completed: 4,
  cancelled: 0,
  fiscalAttention: 1,
  overdue: 0,
};

describe("mapTripWorkbenchBuckets", () => {
  it("hace de Atención fiscal un bucket activo de la misma lista (sin crossLink a invoiceable)", () => {
    const onFiscalAttentionChange = vi.fn();
    const buckets = mapTripWorkbenchBuckets({
      summary,
      visibleBuckets: TRIP_WORKBENCH_BUCKETS,
      activeBucket: null,
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: true,
      onFiscalAttentionChange,
    });

    const fiscal = buckets.find((b) => b.id === "fiscal_attention");
    expect(fiscal).toBeDefined();
    expect(fiscal?.isActive).toBe(true);
    expect(fiscal?.crossLink).toBeUndefined();
    expect(fiscal?.count).toBe(1);
    expect(fiscal?.description).toBe(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttention,
    );
    expect(JSON.stringify(fiscal)).not.toMatch(/facturable/i);
    expect(JSON.stringify(fiscal)).not.toMatch(/invoiceable/i);

    fiscal?.onClick();
    expect(onFiscalAttentionChange).toHaveBeenCalledWith(false);
  });

  it("muestra el bucket cuando hay conteo aunque el filtro esté apagado", () => {
    const onFiscalAttentionChange = vi.fn();
    const buckets = mapTripWorkbenchBuckets({
      summary,
      visibleBuckets: TRIP_WORKBENCH_BUCKETS,
      activeBucket: "in_progress",
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: false,
      onFiscalAttentionChange,
    });

    const fiscal = buckets.find((b) => b.id === "fiscal_attention");
    expect(fiscal?.isActive).toBe(false);
    fiscal?.onClick();
    expect(onFiscalAttentionChange).toHaveBeenCalledWith(true);
  });

  it("oculta el bucket cuando no hay atención y el filtro está apagado", () => {
    const buckets = mapTripWorkbenchBuckets({
      summary: { ...summary, fiscalAttention: 0 },
      visibleBuckets: TRIP_WORKBENCH_BUCKETS,
      activeBucket: null,
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: false,
      onFiscalAttentionChange: vi.fn(),
    });

    expect(buckets.find((b) => b.id === "fiscal_attention")).toBeUndefined();
  });
});
