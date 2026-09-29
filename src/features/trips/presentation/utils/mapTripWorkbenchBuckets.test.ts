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

  it("usa copy de estados del envío cuando hay overrides de cliente", () => {
    const buckets = mapTripWorkbenchBuckets({
      summary,
      visibleBuckets: ["scheduled", "in_progress", "completed"],
      activeBucket: null,
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: false,
      onFiscalAttentionChange: vi.fn(),
      showFiscalAttention: false,
      bucketDescriptionOverrides: {
        scheduled: tripsListCopy.workbench.bucketDescriptions.scheduledClient,
        in_progress: tripsListCopy.workbench.bucketDescriptions.inProgressClient,
        completed: tripsListCopy.workbench.bucketDescriptions.completedClient,
      },
    });

    expect(buckets.find((b) => b.id === "scheduled")?.description).toBe(
      tripsListCopy.workbench.bucketDescriptions.scheduledClient,
    );
    expect(buckets.find((b) => b.id === "scheduled")?.description).not.toMatch(
      /listos para iniciar/i,
    );
  });

  it("oculta el bucket fiscal en portal lean aunque haya conteo", () => {
    const buckets = mapTripWorkbenchBuckets({
      summary,
      visibleBuckets: ["scheduled", "in_progress", "completed"],
      activeBucket: null,
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: false,
      onFiscalAttentionChange: vi.fn(),
      showFiscalAttention: false,
    });

    expect(buckets.find((b) => b.id === "fiscal_attention")).toBeUndefined();
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

  it("usa copy de escala fiscal cuando se pasa override de dispatcher", () => {
    const buckets = mapTripWorkbenchBuckets({
      summary,
      visibleBuckets: TRIP_WORKBENCH_BUCKETS,
      activeBucket: null,
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: true,
      onFiscalAttentionChange: vi.fn(),
      fiscalAttentionDescription:
        tripsListCopy.workbench.bucketDescriptions.fiscalAttentionEscalate,
    });

    const fiscal = buckets.find((b) => b.id === "fiscal_attention");
    expect(fiscal?.description).toBe(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionEscalate,
    );
    expect(fiscal?.description).not.toMatch(/sustitución/i);
  });

  it("usa copy de receptor accountant en Atención fiscal", () => {
    const buckets = mapTripWorkbenchBuckets({
      summary,
      visibleBuckets: TRIP_WORKBENCH_BUCKETS,
      activeBucket: null,
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: true,
      onFiscalAttentionChange: vi.fn(),
      fiscalAttentionDescription:
        tripsListCopy.workbench.bucketDescriptions.fiscalAttentionAccountant,
    });

    const fiscal = buckets.find((b) => b.id === "fiscal_attention");
    expect(fiscal?.description).toBe(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionAccountant,
    );
    expect(fiscal?.description).not.toMatch(/avisar a facturación/i);
  });

  it("usa copy de ejecución manager en Atención fiscal", () => {
    const buckets = mapTripWorkbenchBuckets({
      summary,
      visibleBuckets: TRIP_WORKBENCH_BUCKETS,
      activeBucket: null,
      onBucketChange: vi.fn(),
      fiscalAttentionOnly: true,
      onFiscalAttentionChange: vi.fn(),
      fiscalAttentionDescription:
        tripsListCopy.workbench.bucketDescriptions.fiscalAttentionManager,
    });

    const fiscal = buckets.find((b) => b.id === "fiscal_attention");
    expect(fiscal?.description).toBe(
      tripsListCopy.workbench.bucketDescriptions.fiscalAttentionManager,
    );
    expect(fiscal?.description).not.toMatch(/avisar a facturación/i);
    expect(fiscal?.description).not.toMatch(/pide a un gerente/i);
  });
});
