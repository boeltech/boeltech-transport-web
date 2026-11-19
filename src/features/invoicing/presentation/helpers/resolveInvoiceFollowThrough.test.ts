import { describe, expect, it } from "vitest";

import { invoicingCopy } from "../copy/invoicingCopy";
import { resolveInvoiceFollowThrough } from "./resolveInvoiceFollowThrough";

const BANNED_FOLLOW_THROUGH =
  /XML|PDF|PUE|REP|crédito|sella|segundo plano|complemento|timbre|cobro|pago/i;

describe("resolveInvoiceFollowThrough", () => {
  it("no enseña follow-through en borrador", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "draft",
        dispatchSentAt: null,
      }),
    ).toEqual({ showSend: false });
  });

  it("timbrada sin envío: tip de correo (independiente del saldo)", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: null,
      }),
    ).toEqual({ showSend: true });
  });

  it("timbrada ya enviada: sin tip", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: "2026-09-11T12:00:00.000Z",
      }),
    ).toEqual({ showSend: false });
  });

  it("copy de follow-through es tip de correo (sin cobro ni checklist)", () => {
    const { hint } = invoicingCopy.detail;
    expect(hint.followThroughSend).not.toMatch(BANNED_FOLLOW_THROUGH);
    expect(hint.followThroughSend).toMatch(/correo/i);
    expect(hint.followThroughDismiss).toBe("Entendido");
    expect(hint).not.toHaveProperty("followThroughCollect");
    expect(hint).not.toHaveProperty("followThroughSendBoth");
    expect(hint).not.toHaveProperty("followThroughCollectBoth");
  });
});
