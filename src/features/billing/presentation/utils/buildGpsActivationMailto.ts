/**
 * Mailto v1 — solicitud de activación Monitoreo GPS (PRD §X3).
 * Sin precio (DC8). Sin endpoint ni «Solicitud enviada».
 * Compartido: presentación GPS (F3) + Mi suscripción › Complementos (F4).
 */

export const GPS_ACTIVATION_BILLING_EMAIL = "billing@boeltech.com";

export interface GpsActivationMailtoParams {
  readonly companyName: string;
  /** RFC del tenant; si falta → literal «No disponible». */
  readonly rfc?: string | null;
  readonly userName: string;
  readonly userEmail: string;
}

export function buildGpsActivationMailto(
  params: GpsActivationMailtoParams,
): string {
  const companyName = params.companyName.trim() || "Empresa";
  const rfc = params.rfc?.trim() ? params.rfc.trim() : "No disponible";
  const userName = params.userName.trim() || "Usuario";
  const userEmail = params.userEmail.trim() || "No disponible";

  const subject = `Solicitud de activación — Monitoreo GPS — ${companyName}`;
  const body = [
    "Hola Boeltech,",
    "",
    "Solicito la activación del complemento Monitoreo GPS.",
    "",
    `Empresa: ${companyName}`,
    `RFC: ${rfc}`,
    `Usuario: ${userName}`,
    `Correo: ${userEmail}`,
    "",
    "Quedo atento a la cotización según nuestra flota.",
  ].join("\n");

  return `mailto:${GPS_ACTIVATION_BILLING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
