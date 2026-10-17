import { describe, expect, it } from "vitest";

import {
  mapDemoSeedApplyResult,
  mapDemoSeedPurgeResult,
  mapDemoSeedStatus,
} from "./demoSeedMappers";

describe("mapDemoSeedStatus", () => {
  it("mapea snake_case a camelCase", () => {
    const result = mapDemoSeedStatus({
      pack: "demo_ops_v1",
      status: "completed",
      has_demo_data: true,
      seed_available: false,
      purge_allowed: true,
      include_draft_trip: true,
      entity_counts: { client: 1, vehicle: 2, driver: 1 },
      created_at: "2026-10-17T12:00:00.000Z",
    });

    expect(result).toEqual({
      pack: "demo_ops_v1",
      status: "completed",
      hasDemoData: true,
      seedAvailable: false,
      purgeAllowed: true,
      includeDraftTrip: true,
      entityCounts: { client: 1, vehicle: 2, driver: 1 },
      createdAt: "2026-10-17T12:00:00.000Z",
    });
  });

  it("normaliza status y nulls cuando no hay run", () => {
    const result = mapDemoSeedStatus({
      pack: null,
      status: null,
      has_demo_data: false,
      seed_available: true,
      purge_allowed: false,
      include_draft_trip: null,
      entity_counts: {},
      created_at: null,
    });

    expect(result.hasDemoData).toBe(false);
    expect(result.seedAvailable).toBe(true);
    expect(result.status).toBeNull();
    expect(result.includeDraftTrip).toBeNull();
  });
});

describe("mapDemoSeedApplyResult", () => {
  it("mapea entity_ids a camelCase", () => {
    const result = mapDemoSeedApplyResult({
      run_id: "run-1",
      pack: "demo_ops_v1",
      status: "completed",
      include_draft_trip: true,
      entity_counts: { client: 1 },
      entity_ids: [{ entity_type: "client", entity_id: "c-1" }],
    });

    expect(result.runId).toBe("run-1");
    expect(result.entityIds).toEqual([
      { entityType: "client", entityId: "c-1" },
    ]);
  });
});

describe("mapDemoSeedPurgeResult", () => {
  it("mapea purged_entity_counts", () => {
    const result = mapDemoSeedPurgeResult({
      run_id: "run-1",
      pack: "demo_ops_v1",
      status: "purged",
      purged_entity_counts: { client: 1, vehicle: 2 },
    });

    expect(result.status).toBe("purged");
    expect(result.purgedEntityCounts).toEqual({ client: 1, vehicle: 2 });
  });
});
