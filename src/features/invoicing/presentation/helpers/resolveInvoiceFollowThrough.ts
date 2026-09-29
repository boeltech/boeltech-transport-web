/**
 * Siguiente paso post-timbre (D11): Enviar / Cobrar en esta pantalla.
 * Sin navegar a módulos Envíos/Cobros ni inventar paso REP.
 */

export type InvoiceFollowThrough = {
  readonly showSend: boolean;
  readonly showCollect: boolean;
};

export function resolveInvoiceFollowThrough(input: {
  status: string;
  dispatchSentAt: string | null | undefined;
  balanceDue: number;
}): InvoiceFollowThrough {
  if (input.status !== "stamped") {
    return { showSend: false, showCollect: false };
  }

  return {
    showSend: !input.dispatchSentAt,
    showCollect: input.balanceDue > 0,
  };
}
