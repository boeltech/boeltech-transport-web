import type {
  DemoSeedApplyResult,
  DemoSeedPurgeResult,
  DemoSeedRunStatus,
  DemoSeedStatus,
} from "../domain/types";

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asNullableString(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function asRunStatus(value: unknown): DemoSeedRunStatus | null {
  const raw = asString(value);
  if (raw === "completed" || raw === "purged") return raw;
  return null;
}

function asEntityCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    out[key] = asNumber(raw);
  }
  return out;
}

export function mapDemoSeedStatus(raw: Record<string, unknown>): DemoSeedStatus {
  return {
    pack: asNullableString(raw.pack),
    status: asRunStatus(raw.status),
    hasDemoData: asBoolean(raw.has_demo_data),
    seedAvailable: asBoolean(raw.seed_available),
    purgeAllowed: asBoolean(raw.purge_allowed),
    includeDraftTrip:
      raw.include_draft_trip == null
        ? null
        : asBoolean(raw.include_draft_trip),
    entityCounts: asEntityCounts(raw.entity_counts),
    createdAt: asNullableString(raw.created_at),
  };
}

export function mapDemoSeedApplyResult(
  raw: Record<string, unknown>,
): DemoSeedApplyResult {
  const idsRaw = Array.isArray(raw.entity_ids) ? raw.entity_ids : [];
  return {
    runId: asString(raw.run_id),
    pack: asString(raw.pack),
    status: "completed",
    includeDraftTrip: asBoolean(raw.include_draft_trip),
    entityCounts: asEntityCounts(raw.entity_counts),
    entityIds: idsRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        entityType: asString(row.entity_type),
        entityId: asString(row.entity_id),
      };
    }),
  };
}

export function mapDemoSeedPurgeResult(
  raw: Record<string, unknown>,
): DemoSeedPurgeResult {
  return {
    runId: asString(raw.run_id),
    pack: asString(raw.pack),
    status: "purged",
    purgedEntityCounts: asEntityCounts(raw.purged_entity_counts),
  };
}
