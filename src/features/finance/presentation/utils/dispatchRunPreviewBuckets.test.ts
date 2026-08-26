import { describe, expect, it } from "vitest";
import type { BillingDispatchRunItem } from "../../domain/billingDispatchRun.types";
import {
  buildClientSendResults,
  buildPendingStampInvoicePath,
  canConfirmForceResend,
  clientDisplayName,
  clientGroupHasMultipleScopes,
  clientIdsFromItems,
  countDispatchPreviewBuckets,
  countFailedClientResults,
  groupAlreadySentByClient,
  groupPendingStampByClient,
  groupReadyToSendByClient,
  isDispatchRunInFlight,
  shouldCollapseClientGroups,
  shouldCollapsePendingCard,
  shouldShowAttachmentsHint,
  splitDispatchRunItems,
  summarizeReadyToSend,
} from "./dispatchRunPreviewBuckets";

function item(
  partial: Partial<BillingDispatchRunItem> &
    Pick<BillingDispatchRunItem, "id" | "itemKind" | "clientId" | "status">,
): BillingDispatchRunItem {
  return {
    tripId: null,
    invoiceId: null,
    billingScope: null,
    emailMessageId: null,
    errorMessage: null,
    sentAt: null,
    createdAt: "",
    updatedAt: "",
    ...partial,
  };
}

describe("dispatchRunPreviewBuckets", () => {
  it("countDispatchPreviewBuckets defaults to zero", () => {
    expect(countDispatchPreviewBuckets()).toEqual({
      pendingStampCount: 0,
      readyToSendCount: 0,
      alreadySentSkipped: 0,
    });
  });

  it("splitDispatchRunItems separates kinds and skipped", () => {
    const items: BillingDispatchRunItem[] = [
      item({
        id: "1",
        itemKind: "pending_stamp",
        tripId: "t1",
        clientId: "c1",
        status: "listed",
        billingScope: "primary_transport",
      }),
      item({
        id: "2",
        itemKind: "ready_to_send",
        tripId: "t2",
        invoiceId: "inv1",
        clientId: "c1",
        folio: "A-1",
        status: "listed",
      }),
      item({
        id: "3",
        itemKind: "ready_to_send",
        tripId: "t3",
        invoiceId: "inv2",
        clientId: "c2",
        folio: "A-2",
        status: "skipped",
      }),
    ];
    const { pendingStamp, readyToSend, alreadySent } =
      splitDispatchRunItems(items);
    expect(pendingStamp).toHaveLength(1);
    expect(readyToSend).toHaveLength(1);
    expect(alreadySent).toHaveLength(1);
    expect(alreadySent[0]!.invoiceId).toBe("inv2");
  });

  it("groupReadyToSendByClient excludes skipped", () => {
    const items: BillingDispatchRunItem[] = [
      item({
        id: "1",
        itemKind: "ready_to_send",
        invoiceId: "i1",
        clientId: "c1",
        status: "listed",
      }),
      item({
        id: "2",
        itemKind: "ready_to_send",
        invoiceId: "i2",
        clientId: "c1",
        status: "skipped",
      }),
    ];
    expect(groupReadyToSendByClient(items).get("c1")).toHaveLength(1);
    expect(groupAlreadySentByClient(items).get("c1")).toHaveLength(1);
  });

  it("groupPendingStampByClient groups pending by client", () => {
    const items: BillingDispatchRunItem[] = [
      item({
        id: "1",
        itemKind: "pending_stamp",
        tripId: "t1",
        clientId: "c1",
        status: "listed",
        billingScope: "primary_transport",
      }),
      item({
        id: "2",
        itemKind: "pending_stamp",
        tripId: "t2",
        clientId: "c1",
        status: "listed",
        billingScope: "false_trip",
      }),
    ];
    expect(groupPendingStampByClient(items).get("c1")).toHaveLength(2);
  });

  it("summarizeReadyToSend ignores skipped folios", () => {
    const items: BillingDispatchRunItem[] = [
      item({
        id: "1",
        itemKind: "ready_to_send",
        invoiceId: "i1",
        clientId: "c1",
        status: "listed",
      }),
      item({
        id: "2",
        itemKind: "ready_to_send",
        invoiceId: "i2",
        clientId: "c2",
        status: "skipped",
      }),
    ];
    expect(summarizeReadyToSend(items)).toEqual({
      clientCount: 1,
      folioCount: 1,
    });
  });

  it("canConfirmForceResend only in previewed with selection", () => {
    expect(canConfirmForceResend("previewed", 1)).toBe(true);
    expect(canConfirmForceResend("previewed", 0)).toBe(false);
    expect(canConfirmForceResend("completed", 2)).toBe(false);
    expect(canConfirmForceResend("sending", 2)).toBe(false);
  });

  it("clientIdsFromItems returns unique ids", () => {
    expect(
      clientIdsFromItems([
        item({
          id: "1",
          itemKind: "ready_to_send",
          clientId: "c1",
          status: "skipped",
        }),
        item({
          id: "2",
          itemKind: "ready_to_send",
          clientId: "c1",
          status: "skipped",
        }),
        item({
          id: "3",
          itemKind: "ready_to_send",
          clientId: "c2",
          status: "skipped",
        }),
      ]),
    ).toEqual(["c1", "c2"]);
  });

  it("clientGroupHasMultipleScopes is true only with mixed scopes", () => {
    const same: BillingDispatchRunItem[] = [
      item({
        id: "1",
        itemKind: "pending_stamp",
        tripId: "t1",
        clientId: "c1",
        status: "listed",
        billingScope: "primary_transport",
      }),
      item({
        id: "2",
        itemKind: "pending_stamp",
        tripId: "t2",
        clientId: "c1",
        status: "listed",
        billingScope: "primary_transport",
      }),
    ];
    expect(clientGroupHasMultipleScopes(same)).toBe(false);

    const mixed: BillingDispatchRunItem[] = [
      same[0]!,
      {
        ...same[1]!,
        id: "3",
        billingScope: "false_trip",
      },
    ];
    expect(clientGroupHasMultipleScopes(mixed)).toBe(true);
  });

  it("clientDisplayName prefers name · rfc over id fallback", () => {
    const fallback = (s: string) => `Cliente ${s}`;
    expect(
      clientDisplayName(
        item({
          id: "1",
          itemKind: "ready_to_send",
          invoiceId: "i1",
          clientId: "4d8441db-aaaa-bbbb-cccc-ddddeeee0001",
          clientName: "Transportes Demo",
          clientRfc: "TDE010101AAA",
          status: "listed",
        }),
        fallback,
      ),
    ).toBe("Transportes Demo · TDE010101AAA");

    expect(
      clientDisplayName(
        item({
          id: "2",
          itemKind: "ready_to_send",
          invoiceId: "i2",
          clientId: "4d8441db-aaaa-bbbb-cccc-ddddeeee0001",
          status: "listed",
        }),
        fallback,
      ),
    ).toBe("Cliente 4d8441db");
  });

  it("buildPendingStampInvoicePath adds scope when needed", () => {
    expect(
      buildPendingStampInvoicePath(
        item({
          id: "x",
          itemKind: "pending_stamp",
          tripId: "trip-9",
          clientId: "c1",
          status: "listed",
          billingScope: "false_trip",
        }),
      ),
    ).toBe("/invoices/new?trip_id=trip-9&scope=false_trip");
  });

  it("shouldCollapseClientGroups uses D2 thresholds", () => {
    expect(shouldCollapseClientGroups(10, 4)).toBe(false);
    expect(shouldCollapseClientGroups(21, 3)).toBe(true);
    expect(shouldCollapseClientGroups(10, 6)).toBe(true);
  });

  it("shouldCollapsePendingCard when pending exceeds ready", () => {
    expect(shouldCollapsePendingCard(5, 10)).toBe(false);
    expect(shouldCollapsePendingCard(11, 10)).toBe(true);
  });

  it("shouldShowAttachmentsHint when avg folios per client > 4 (ZIP)", () => {
    expect(shouldShowAttachmentsHint(8, 2)).toBe(false);
    expect(shouldShowAttachmentsHint(10, 2)).toBe(true);
  });

  it("isDispatchRunInFlight for sending states", () => {
    expect(isDispatchRunInFlight("sending")).toBe(true);
    expect(isDispatchRunInFlight("send_confirmed")).toBe(true);
    expect(isDispatchRunInFlight("previewed")).toBe(false);
    expect(isDispatchRunInFlight("completed")).toBe(false);
  });

  it("buildClientSendResults aggregates receipts and item failures", () => {
    const items: BillingDispatchRunItem[] = [
      item({
        id: "1",
        itemKind: "ready_to_send",
        invoiceId: "inv1",
        clientId: "c1",
        clientName: "Acme",
        folio: "A-1",
        status: "sent",
      }),
      item({
        id: "2",
        itemKind: "ready_to_send",
        invoiceId: "inv2",
        clientId: "c2",
        clientName: "Beta",
        folio: "B-1",
        status: "failed",
        errorMessage: "SMTP",
      }),
      item({
        id: "3",
        itemKind: "ready_to_send",
        invoiceId: "inv3",
        clientId: "c3",
        clientName: "Skip",
        folio: "C-1",
        status: "skipped",
      }),
    ];
    const rows = buildClientSendResults(items, [
      {
        clientId: "c1",
        recipients: [
          {
            key: "billing_email",
            kind: "billing_email",
            label: "Facturación",
            email: "a@test.com",
          },
        ],
        emailMessageId: "m1",
        status: "sent",
        errorMessage: null,
        sentAt: "2026-08-08T12:00:00.000Z",
        createdAt: "2026-08-08T12:00:00.000Z",
        updatedAt: "2026-08-08T12:00:00.000Z",
      },
      {
        clientId: "c2",
        recipients: [],
        emailMessageId: null,
        status: "failed",
        errorMessage: "SMTP",
        sentAt: null,
        createdAt: "2026-08-08T12:00:00.000Z",
        updatedAt: "2026-08-08T12:00:00.000Z",
      },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.clientId === "c1")?.status).toBe("sent");
    expect(rows.find((r) => r.clientId === "c2")?.status).toBe("failed");
    expect(countFailedClientResults(rows)).toBe(1);
  });
});
