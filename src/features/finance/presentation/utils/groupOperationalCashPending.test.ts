import { describe, expect, it } from "vitest";
import type {
  OperationalCashPendingByClient,
  OperationalCashPendingTrip,
} from "@features/finance/domain/operationalCashPending";
import { groupOperationalCashPendingByClient } from "./groupOperationalCashPending";

function trip(
  partial: Partial<OperationalCashPendingTrip> &
    Pick<OperationalCashPendingTrip, "id" | "clientId">,
): OperationalCashPendingTrip {
  return {
    code: partial.code ?? partial.id,
    status: partial.status ?? "completed",
    clientName: partial.clientName ?? "Cliente",
    baseRate: partial.baseRate ?? 1000,
    scheduledDeparture: partial.scheduledDeparture ?? "2026-11-01T12:00:00.000Z",
    operationalCash: partial.operationalCash ?? {
      status: "pending",
      collectedTotal: 0,
      pendingAmount: 1000,
      receiptCount: 0,
    },
    ...partial,
  };
}

describe("groupOperationalCashPendingByClient", () => {
  it("groups page trips under meta.by_client order and keeps universe subtotals", () => {
    const byClient: OperationalCashPendingByClient[] = [
      {
        clientId: "c-a",
        clientName: "Alpha",
        pendingAmount: 5000,
        tripCount: 2,
      },
      {
        clientId: "c-b",
        clientName: "Beta",
        pendingAmount: 3000,
        tripCount: 1,
      },
    ];
    const trips = [
      trip({ id: "t1", clientId: "c-b", clientName: "Beta", code: "V-B" }),
      trip({ id: "t2", clientId: "c-a", clientName: "Alpha", code: "V-A1" }),
      trip({ id: "t3", clientId: "c-a", clientName: "Alpha", code: "V-A2" }),
    ];

    const groups = groupOperationalCashPendingByClient(trips, byClient);

    expect(groups.map((g) => g.clientId)).toEqual(["c-a", "c-b"]);
    expect(groups[0]!.pendingAmount).toBe(5000);
    expect(groups[0]!.tripCount).toBe(2);
    expect(groups[0]!.trips.map((t) => t.id)).toEqual(["t2", "t3"]);
    expect(groups[1]!.trips.map((t) => t.id)).toEqual(["t1"]);
  });

  it("skips by_client entries with no trips on the current page", () => {
    const byClient: OperationalCashPendingByClient[] = [
      {
        clientId: "c-a",
        clientName: "Alpha",
        pendingAmount: 1000,
        tripCount: 1,
      },
      {
        clientId: "c-b",
        clientName: "Beta",
        pendingAmount: 2000,
        tripCount: 1,
      },
    ];
    const trips = [trip({ id: "t1", clientId: "c-b", clientName: "Beta" })];

    const groups = groupOperationalCashPendingByClient(trips, byClient);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.clientId).toBe("c-b");
  });
});
