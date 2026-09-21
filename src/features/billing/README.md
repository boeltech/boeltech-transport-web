# Billing feature — Stripe-A (tenant)

Cobro de **suscripción SaaS** Boeltech→tenant (ADR-0076). No es pago de factura CFDI / flete del viaje.

## Test mode (local)

1. En API: `STRIPE_SECRET_KEY` (sk_test_…) o Stub documentado.
2. En web `env/.env.local`: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_…`
3. Sin publishable key → la card de métodos de pago y «Pagar ahora» no se muestran.
4. Tarjeta test Stripe: `4242 4242 4242 4242`, cualquier fecha futura, CVC cualquiera.
5. 3DS test: `4000 0025 0000 3155` — la UI llama `confirmCardPayment` si `POST …/pay` responde `requires_action`.

Permisos: `billing.read` ve métodos enmascarados; `billing.update` (admin) agrega / default / elimina / Pagar ahora.
