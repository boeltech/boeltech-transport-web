/**
 * Siguiente paso post-timbre (D11): Enviar / Cobrar / PUE sin inventar REP.
 */

export type InvoiceFollowThrough = {
  readonly showSend: boolean;
  readonly showCollect: boolean;
  readonly showPueNoRep: boolean;
};

export function resolveInvoiceFollowThrough(input: {
  status: string;
  dispatchSentAt: string | null | undefined;
  paymentMethod: string;
  balanceDue: number;
}): InvoiceFollowThrough {
  if (input.status !== "stamped") {
    return { showSend: false, showCollect: false, showPueNoRep: false };
  }

  const isPpd = input.paymentMethod === "PPD";
  return {
    showSend: !input.dispatchSentAt,
    showCollect: isPpd && input.balanceDue > 0,
    showPueNoRep: !isPpd,
  };
}
