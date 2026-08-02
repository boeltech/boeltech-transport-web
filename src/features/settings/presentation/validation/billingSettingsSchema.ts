/**
 * Esquema del formulario de datos para facturar.
 *
 * El proveedor de timbrado y el modo de prueba no tienen control visible: se
 * rehidratan desde el servidor y se reenvían sin alterarlos.
 *
 * La serie de Carta Porte fue retirada del contrato (migración 132): la emisión
 * usa una sola serie (`serie_factura`).
 */

import { z } from "zod";

import {
  PAC_USES_CREDENTIALS,
  resolveSelectablePacProvider,
  type BillingSettings,
  type PacProvider,
} from "../../domain";

export const ALLOWED_MONEDA = ["MXN", "USD"] as const;
export const ALLOWED_TASA_IVA = [0, 0.08, 0.16] as const;

export type AllowedMoneda = (typeof ALLOWED_MONEDA)[number];
export type AllowedTasaIva = (typeof ALLOWED_TASA_IVA)[number];

export function normalizeMoneda(value: unknown): AllowedMoneda | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return ALLOWED_MONEDA.includes(normalized as AllowedMoneda)
    ? (normalized as AllowedMoneda)
    : null;
}

export function normalizeTasaIva(value: unknown): AllowedTasaIva | null {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return null;
  const matched = ALLOWED_TASA_IVA.find(
    (allowed) => Math.abs(allowed - parsed) < 0.000001,
  );
  return matched ?? null;
}

export const billingSettingsSchema = z
  .object({
    pacProvider: z.string().min(1, "Falta el timbrador"),
    // Credenciales opcionales a nivel schema — la validación condicional
    // se resuelve en superRefine según el timbrador configurado.
    pacUsername: z.string().optional(),
    pacPassword: z.string().optional(),
    defaultUsoCfdi: z.string().min(1, "Elige el uso de CFDI que se precargará"),
    defaultFormaPago: z
      .string()
      .min(1, "Elige la forma de pago que se precargará"),
    defaultMetodoPago: z
      .string()
      .min(1, "Elige el método de pago que se precargará"),
    serieFactura: z
      .string()
      .min(1, "Escribe la serie de tus facturas de servicio")
      .max(5, "La serie admite hasta 5 caracteres"),
    folioInicial: z
      .number({ message: "Escribe el primer folio de tus facturas de servicio" })
      .min(1, "El primer folio debe ser 1 o mayor"),
    testMode: z.boolean(),
    claveProductoServicio: z
      .string()
      .min(1, "Elige la clave de producto o servicio que se precargará"),
    claveUnidad: z.string().min(1, "Elige la clave de unidad que se precargará"),
    moneda: z.enum(ALLOWED_MONEDA, {
      message: "Elige una moneda válida: peso mexicano o dólar",
    }),
    tasaIva: z
      .number()
      .refine(
        (value) => ALLOWED_TASA_IVA.includes(value as AllowedTasaIva),
        { message: "Elige una tasa de IVA válida: 0%, 8% o 16%" },
      ),
  })
  .superRefine((data, ctx) => {
    // Solo los timbradores con credenciales por empresa requieren usuario.
    const usesCredentials =
      PAC_USES_CREDENTIALS[data.pacProvider as PacProvider] ?? false;
    if (usesCredentials && !data.pacUsername?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pacUsername"],
        message: "Este timbrador necesita un usuario configurado",
      });
    }
  });

export type BillingSettingsFormData = z.infer<typeof billingSettingsSchema>;

export function mapSettingsToForm(
  settings: BillingSettings,
): BillingSettingsFormData {
  return {
    pacProvider: resolveSelectablePacProvider(settings.pacProvider),
    pacUsername: settings.pacUsername ?? "",
    // El servidor nunca devuelve el password; no rehidratar.
    pacPassword: "",
    defaultUsoCfdi: settings.defaultUsoCfdi,
    defaultFormaPago: settings.defaultFormaPago,
    defaultMetodoPago: settings.defaultMetodoPago,
    serieFactura: settings.serieFactura,
    folioInicial: settings.folioInicial,
    testMode: settings.testMode,
    claveProductoServicio: settings.claveProductoServicio,
    claveUnidad: settings.claveUnidad,
    moneda: normalizeMoneda(settings.moneda) ?? "MXN",
    tasaIva: normalizeTasaIva(settings.tasaIva) ?? 0.16,
  };
}
