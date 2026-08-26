import { describe, expect, it } from "vitest";
import type {
  BillingDispatchRunItem,
  RecipientsByClient,
} from "../../domain/billingDispatchRun.types";
import {
  buildForceResendPayload,
  clearInvoiceSelection,
  selectAllSkippedInvoiceIds,
  selectClientSkippedInvoiceIds,
  skippedItemsForSelection,
  toggleInvoiceId,
} from "./dispatchRunResendSelection";

const skipped: BillingDispatchRunItem[] = [
  {
    id: "1",
    itemKind: "ready_to_send",
    tripId: "t1",
    invoiceId: "inv-a",
    billingScope: null,
    clientId: "c1",
    status: "skipped",
    folio: "A-1",
    emailMessageId: null,
    errorMessage: null,
    sentAt: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "2",
    itemKind: "ready_to_send",
    tripId: "t2",
    invoiceId: "inv-b",
    billingScope: null,
    clientId: "c1",
    status: "skipped",
    folio: "A-2",
    emailMessageId: null,
    errorMessage: null,
    sentAt: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "3",
    itemKind: "ready_to_send",
    tripId: "t3",
    invoiceId: "inv-c",
    billingScope: null,
    clientId: "c2",
    status: "skipped",
    folio: "B-1",
    emailMessageId: null,
    errorMessage: null,
    sentAt: null,
    createdAt: "",
    updatedAt: "",
  },
];

const groups: RecipientsByClient[] = [
  {
    clientId: "c1",
    clientName: "Acme",
    recipients: [
      {
        key: "billing_email",
        kind: "billing_email",
        label: "Facturación",
        email: "bill@acme.test",
      },
      {
        key: "contact:x",
        kind: "contact",
        contactId: "x",
        label: "Ana",
        email: "ana@acme.test",
      },
    ],
  },
  {
    clientId: "c2",
    clientName: "Beta",
    recipients: [
      {
        key: "billing_email",
        kind: "billing_email",
        label: "Facturación",
        email: "bill@beta.test",
      },
    ],
  },
];

describe("dispatchRunResendSelection", () => {
  it("toggleInvoiceId adds and removes", () => {
    let selection = clearInvoiceSelection();
    selection = toggleInvoiceId(selection, "inv-a", true);
    expect(selection).toEqual(["inv-a"]);
    selection = toggleInvoiceId(selection, "inv-a", false);
    expect(selection).toEqual([]);
  });

  it("selectAllSkippedInvoiceIds and selectClient", () => {
    expect(selectAllSkippedInvoiceIds(skipped)).toEqual([
      "inv-a",
      "inv-b",
      "inv-c",
    ]);
    expect(selectClientSkippedInvoiceIds(skipped, "c1", ["inv-c"])).toEqual([
      "inv-c",
      "inv-a",
      "inv-b",
    ]);
  });

  it("buildForceResendPayload includes forceResend + ids; overrides only subset", () => {
    const payload = buildForceResendPayload(
      ["inv-a"],
      groups,
      {
        c1: ["contact:x"],
        c2: ["billing_email"],
      },
      ["c1"],
    );
    expect(payload).toEqual({
      forceResend: true,
      invoiceIds: ["inv-a"],
      recipientOverrides: [{ clientId: "c1", recipientKeys: ["contact:x"] }],
    });
  });

  it("buildForceResendPayload omits overrides when all selected", () => {
    const payload = buildForceResendPayload(
      ["inv-a", "inv-c"],
      groups,
      {
        c1: ["billing_email", "contact:x"],
        c2: ["billing_email"],
      },
      ["c1", "c2"],
    );
    expect(payload.forceResend).toBe(true);
    expect(payload.invoiceIds).toEqual(["inv-a", "inv-c"]);
    expect(payload.recipientOverrides).toBeUndefined();
  });

  it("skippedItemsForSelection filters by invoice id", () => {
    expect(skippedItemsForSelection(skipped, ["inv-b", "inv-c"])).toHaveLength(
      2,
    );
  });
});
