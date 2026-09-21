/**
 * Confirm PaymentIntent when tenant pay returns requires_action (3DS).
 */
import {
  getStripePromise,
  isStripePublishableConfigured,
} from "../../infrastructure/stripeClient";

export async function confirmCardPaymentIfRequired(
  clientSecret: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isStripePublishableConfigured()) {
    return {
      ok: false,
      message: "Cobro con tarjeta no configurado en este entorno.",
    };
  }
  const stripe = await getStripePromise();
  if (!stripe) {
    return {
      ok: false,
      message: "No se pudo cargar Stripe. Recarga la página e inténtalo de nuevo.",
    };
  }
  const result = await stripe.confirmCardPayment(clientSecret);
  if (result.error) {
    return {
      ok: false,
      message:
        result.error.message ??
        "No se pudo completar la autenticación de la tarjeta.",
    };
  }
  return { ok: true };
}
