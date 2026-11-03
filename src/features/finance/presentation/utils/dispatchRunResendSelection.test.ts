import { describe, expect, it } from "vitest";
import type {
  BillingDispatchRunItem,
  RecipientsByClient,
} from "../../domain/billingDispatchRun.types";
import {
  buildForceResendPayload,
  clearResendSelection,
  resendSelectionCount,
  selectAllSkippedDocuments,
  selectClientSkippedDocuments,
  skippedItemsForSelection,
  toggleInvoiceId,
  togglePaymentId,
} from "./dispatchRunResendSelection";

const skipped: BillingDispatchRunItem[] = [
  {
    id: "1",
    itemKind: "ready_to_send",
    documentKind: "invoice",
    tripId: "t1",
    invoiceId: "inv-a",
    paymentId: null,
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
    documentKind: "invoice",
    tripId: "t2",
    invoiceId: "inv-b",
    paymentId: null,
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
    documentKind: "rep",
    tripId: null,
    invoiceId: null,
    paymentId: "pay-1",
    billingScope: null,
    clientId: "c2",
    status: "skipped",
    folio: "uuid-rep-1",
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
  it("toggleInvoiceId and togglePaymentId add and remove", () => {
    let selection = clearResendSelection();
    selection = toggleInvoiceId(selection, "inv-a", true);
    expect(selection).toEqual({ invoiceIds: ["inv-a"], paymentIds: [] });
    selection = togglePaymentId(selection, "pay-1", true);
    expect(selection).toEqual({
      invoiceIds: ["inv-a"],
      paymentIds: ["pay-1"],
    });
    selection = toggleInvoiceId(selection, "inv-a", false);
    expect(selection).toEqual({ invoiceIds: [], paymentIds: ["pay-1"] });
  });

  it("selectAllSkippedDocuments and selectClient include REP payment ids", () => {
    expect(selectAllSkippedDocuments(skipped)).toEqual({
      invoiceIds: ["inv-a", "inv-b"],
      paymentIds: ["pay-1"],
    });
    expect(
      selectClientSkippedDocuments(skipped, "c2", clearResendSelection()),
    ).toEqual({
      invoiceIds: [],
      paymentIds: ["pay-1"],
    });
  });

  it("buildForceResendPayload accepts only paymentIds", () => {
    const payload = buildForceResendPayload(
      { invoiceIds: [], paymentIds: ["pay-1"] },
      groups,
      { c2: ["billing_email"] },
      ["c2"],
    );
    expect(payload).toEqual({
      forceResend: true,
      paymentIds: ["pay-1"],
      recipientOverrides: undefined,
    });
  });

  it("buildForceResendPayload includes forceResend + mixed ids; overrides only subset", () => {
    const payload = buildForceResendPayload(
      { invoiceIds: ["inv-a"], paymentIds: ["pay-1"] },
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
      paymentIds: ["pay-1"],
      recipientOverrides: [{ clientId: "c1", recipientKeys: ["contact:x"] }],
    });
  });

  it("skippedItemsForSelection filters by typed ids", () => {
    expect(
      skippedItemsForSelection(skipped, {
        invoiceIds: ["inv-b"],
        paymentIds: ["pay-1"],
      }),
    ).toHaveLength(2);
    expect(resendSelectionCount({ invoiceIds: ["a"], paymentIds: ["b"] })).toBe(
      2,
    );
  });
});
