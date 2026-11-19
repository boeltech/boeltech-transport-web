/**
 * Tip post-timbre «Siguiente paso»: solo correo (D1–D2).
 * Cobro vive en el header; no se enseña en este banner.
 */

export type InvoiceFollowThrough = {
  readonly showSend: boolean;
};

export function resolveInvoiceFollowThrough(input: {
  status: string;
  dispatchSentAt: string | null | undefined;
}): InvoiceFollowThrough {
  if (input.status !== "stamped") {
    return { showSend: false };
  }

  return {
    showSend: !input.dispatchSentAt,
  };
}
