/**
 * Copy del soft-gate de verificación de correo (Política C / web #35).
 * No afirma un envío previo: el alta puede no haber mandado correo.
 */
export const emailVerificationBannerCopy = {
  title: "Verifica tu correo",
  body: (email: string) =>
    `Revisa la bandeja de ${email} por un enlace de verificación. Si no lo tienes, reenvíalo. Cuando lo hayas abierto, pulsa «Ya verifiqué».`,
  resendSuccessDefault:
    "Te reenviamos un enlace de verificación. Revisa tu bandeja.",
  stillPending:
    "Aún no vemos la verificación. Abre el enlace del correo (o reenvíalo) y vuelve a intentar.",
  verifiedToast: "Correo verificado",
  resendButton: "Reenviar correo",
  resendSending: "Enviando…",
  confirmButton: "Ya verifiqué",
  confirmChecking: "Comprobando…",
} as const;
