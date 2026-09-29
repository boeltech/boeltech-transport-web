import { describe, expect, it } from "vitest";

import { invoicingCopy } from "../copy/invoicingCopy";
import { resolveInvoiceFollowThrough } from "./resolveInvoiceFollowThrough";

const BANNED_FOLLOW_THROUGH =
  /XML|PDF|PUE|REP|crédito|sella|segundo plano|complemento|timbre/i;

describe("resolveInvoiceFollowThrough", () => {
  it("no enseña follow-through en borrador", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "draft",
        dispatchSentAt: null,
        balanceDue: 100,
      }),
    ).toEqual({ showSend: false, showCollect: false });
  });

  it("PPD timbrada sin envío y con saldo: Enviar + Cobrar", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: null,
        balanceDue: 500,
      }),
    ).toEqual({ showSend: true, showCollect: true });
  });

  it("timbrada sin envío y sin saldo: solo Enviar", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: null,
        balanceDue: 0,
      }),
    ).toEqual({ showSend: true, showCollect: false });
  });

  it("PUE timbrada con saldo: también orienta a anotar el cobro", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: "2026-09-11T12:00:00.000Z",
        balanceDue: 200,
      }),
    ).toEqual({ showSend: false, showCollect: true });
  });

  it("copy de follow-through es llano y apunta al header", () => {
    const { hint } = invoicingCopy.detail;
    for (const text of [
      hint.followThroughSend,
      hint.followThroughCollect,
      hint.followThroughSendBoth,
      hint.followThroughCollectBoth,
    ]) {
      expect(text).not.toMatch(BANNED_FOLLOW_THROUGH);
    }
    expect(hint.followThroughSend).toMatch(/Enviar/i);
    expect(hint.followThroughCollect).toMatch(/Registrar pago/i);
    expect(hint.followThroughSendBoth).toMatch(/^1\./);
    expect(hint.followThroughCollectBoth).toMatch(/^2\./);
  });

  it("ya enviada y sin saldo: no pide Enviar ni Cobrar", () => {
    expect(
      resolveInvoiceFollowThrough({
        status: "stamped",
        dispatchSentAt: "2026-09-11T12:00:00.000Z",
        balanceDue: 0,
      }),
    ).toEqual({ showSend: false, showCollect: false });
  });
});
