import { describe, expect, it } from "vitest";

import { invoicingCopy } from "../copy/invoicingCopy";
import { resolveInvoiceFollowThrough } from "./resolveInvoiceFollowThrough";

describe("resolveInvoiceFollowThrough", () => {
  it("no enseña follow-through en borrador", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "draft",
        dispatchSentAt: null,
        paymentMethod: "PPD",
        balanceDue: 100,
      }),
    ).toEqual({ showSend: false, showCollect: false, showPueNoRep: false });
  });

  it("PPD timbrada sin envío y con saldo: Enviar + Cobrar", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: null,
        paymentMethod: "PPD",
        balanceDue: 500,
      }),
    ).toEqual({ showSend: true, showCollect: true, showPueNoRep: false });
  });

  it("PUE timbrada: Enviar y cobro sin inventar REP", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: null,
        paymentMethod: "PUE",
        balanceDue: 0,
      }),
    ).toEqual({ showSend: true, showCollect: false, showPueNoRep: true });
  });

  it("manager: follow-through conserva Enviar y no enseña Por facturar ni emitir", () => {
    expect(invoicingCopy.detail.hint.followThroughSendManager).toMatch(/enví/i);
    expect(invoicingCopy.detail.hint.followThroughSendManager).not.toMatch(
      /Por facturar|emitir/i,
    );
    expect(invoicingCopy.detail.hint.followThroughSendLink).toBe("Ir a Envíos");
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: null,
        paymentMethod: "PPD",
        balanceDue: 500,
      }).showSend,
    ).toBe(true);
  });

  it("ya enviada y PPD sin saldo: no pide Enviar ni Cobrar", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: "2026-09-11T12:00:00.000Z",
        paymentMethod: "PPD",
        balanceDue: 0,
      }),
    ).toEqual({ showSend: false, showCollect: false, showPueNoRep: false });
  });
});
