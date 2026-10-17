import { describe, expect, it } from "vitest";

import {
  filterActivationItemsForMode,
  findFirstPendingL1Item,
  findPendingSoftTrackItems,
  hasPendingItemsForMode,
  isOpsReadyForFiscalTrack,
  resolveActivationChecklistMode,
  resolveActivationEmptyGuidance,
  resolvePreferredFiscalItem,
  shouldShowActivationChecklist,
} from "./activation";
import type { ActivationData, ActivationItem } from "./types";

function item(
  partial: Partial<ActivationItem> & Pick<ActivationItem, "code">,
): ActivationItem {
  return {
    status: "pending",
    requiredForOps: true,
    ctaPath: `/${partial.code}`,
    canAct: true,
    ...partial,
  };
}

function activation(
  overrides: Partial<ActivationData> & { items: ActivationItem[] },
): ActivationData {
  return {
    opsLevel: "empty",
    fiscalTrack: {
      companyRfcSet: false,
      certificateConfigured: false,
      readyHint: "missing_rfc",
    },
    counts: {
      clients: 0,
      vehicles: 0,
      drivers: 0,
      tripsNonCancelled: 0,
      usersNonAdmin: 0,
    },
    demo: {
      hasDemoData: false,
      seedAvailable: false,
      purgeAllowed: false,
    },
    dismissed: false,
    ...overrides,
  };
}

describe("resolveActivationChecklistMode", () => {
  it("admin/manager full; dispatcher compact; accountant fiscal; floor null", () => {
    expect(resolveActivationChecklistMode("admin")).toBe("full");
    expect(resolveActivationChecklistMode("manager")).toBe("full");
    expect(resolveActivationChecklistMode("dispatcher")).toBe(
      "dispatcher_compact",
    );
    expect(resolveActivationChecklistMode("accountant")).toBe(
      "accountant_fiscal",
    );
    expect(resolveActivationChecklistMode("operator")).toBeNull();
    expect(resolveActivationChecklistMode("driver")).toBeNull();
    expect(resolveActivationChecklistMode("client")).toBeNull();
  });
});

describe("resolveActivationEmptyGuidance", () => {
  const pendingClient = item({ code: "client", ctaPath: "/clients/new" });
  const pendingVehicle = item({ code: "vehicle", ctaPath: "/vehicles/new" });
  const doneClient = item({
    code: "client",
    status: "done",
    ctaPath: "/clients/new",
  });

  it("clients never redirects (first master)", () => {
    expect(
      resolveActivationEmptyGuidance(
        "clients",
        activation({ items: [pendingClient] }),
      ),
    ).toBeNull();
  });

  it("vehicles redirects to client when client pending", () => {
    expect(
      resolveActivationEmptyGuidance(
        "vehicles",
        activation({ items: [pendingClient, pendingVehicle] }),
      ),
    ).toEqual({
      redirectToGap: true,
      gapCode: "client",
      ctaPath: "/clients/new",
    });
  });

  it("drivers redirects to first pending L1 before driver", () => {
    expect(
      resolveActivationEmptyGuidance(
        "drivers",
        activation({
          items: [
            doneClient,
            pendingVehicle,
            item({ code: "driver", ctaPath: "/drivers/new" }),
          ],
        }),
      ),
    ).toEqual({
      redirectToGap: true,
      gapCode: "vehicle",
      ctaPath: "/vehicles/new",
    });
  });

  it("trips redirects to first pending L1", () => {
    expect(
      resolveActivationEmptyGuidance(
        "trips",
        activation({ items: [pendingClient] }),
      ),
    ).toEqual({
      redirectToGap: true,
      gapCode: "client",
      ctaPath: "/clients/new",
    });
  });

  it("trips does not redirect when L1 done", () => {
    expect(
      resolveActivationEmptyGuidance(
        "trips",
        activation({
          opsLevel: "l1_ready",
          items: [
            item({ code: "client", status: "done" }),
            item({ code: "vehicle", status: "done" }),
            item({ code: "driver", status: "done" }),
            item({ code: "first_trip", ctaPath: "/trips/new" }),
          ],
        }),
      ),
    ).toBeNull();
  });
});

describe("findFirstPendingL1Item / hasPendingItemsForMode", () => {
  it("finds client before vehicle", () => {
    const found = findFirstPendingL1Item([
      item({ code: "vehicle" }),
      item({ code: "client" }),
    ]);
    expect(found?.code).toBe("client");
  });

  it("dispatcher pending until l1_complete", () => {
    const empty = activation({
      opsLevel: "empty",
      items: [item({ code: "client" })],
    });
    const complete = activation({
      opsLevel: "l1_complete",
      items: [item({ code: "client", status: "done" })],
    });
    expect(hasPendingItemsForMode(empty, "dispatcher_compact")).toBe(true);
    expect(hasPendingItemsForMode(complete, "dispatcher_compact")).toBe(false);
  });

  it("accountant only cares about fiscal items", () => {
    const data = activation({
      items: [
        item({ code: "client" }),
        item({
          code: "company_fiscal",
          requiredForOps: false,
          ctaPath: "/settings/general",
        }),
      ],
    });
    expect(hasPendingItemsForMode(data, "accountant_fiscal")).toBe(true);
    expect(
      filterActivationItemsForMode(data.items, "accountant_fiscal").map(
        (i) => i.code,
      ),
    ).toEqual(["company_fiscal"]);
  });
});

describe("shouldShowActivationChecklist / F3 helpers", () => {
  it("shows full and dispatcher panels after l1_complete even without pending", () => {
    const complete = activation({
      opsLevel: "l1_complete",
      items: [
        item({ code: "client", status: "done" }),
        item({ code: "first_trip", status: "done" }),
      ],
    });
    expect(shouldShowActivationChecklist(complete, "full")).toBe(true);
    expect(shouldShowActivationChecklist(complete, "dispatcher_compact")).toBe(
      true,
    );
    expect(hasPendingItemsForMode(complete, "dispatcher_compact")).toBe(false);
    expect(shouldShowActivationChecklist(complete, "accountant_fiscal")).toBe(
      false,
    );
  });

  it("isOpsReadyForFiscalTrack covers l1_ready and l1_complete", () => {
    expect(isOpsReadyForFiscalTrack("empty")).toBe(false);
    expect(isOpsReadyForFiscalTrack("l1_ready")).toBe(true);
    expect(isOpsReadyForFiscalTrack("l1_complete")).toBe(true);
  });

  it("findPendingSoftTrackItems and resolvePreferredFiscalItem follow ready_hint", () => {
    const items = [
      item({
        code: "company_fiscal",
        requiredForOps: false,
        ctaPath: "/settings/general",
      }),
      item({
        code: "csd_pac",
        requiredForOps: false,
        ctaPath: "/settings/billing",
      }),
      item({
        code: "invite_team",
        requiredForOps: false,
        ctaPath: "/users",
      }),
    ];
    expect(findPendingSoftTrackItems(items).map((i) => i.code)).toEqual([
      "company_fiscal",
      "csd_pac",
      "invite_team",
    ]);
    expect(resolvePreferredFiscalItem(items, "missing_rfc")?.code).toBe(
      "company_fiscal",
    );
    expect(resolvePreferredFiscalItem(items, "missing_csd")?.code).toBe(
      "csd_pac",
    );
    expect(resolvePreferredFiscalItem(items, "ready_for_config")?.code).toBe(
      "csd_pac",
    );
    expect(resolvePreferredFiscalItem(items, "configured")).toBeUndefined();
  });
});
