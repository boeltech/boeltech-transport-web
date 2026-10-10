import {
  classifyGenericRfc,
  isGenericRfc,
  validateGenericReceiverFiscal,
  type GenericRfcKind,
} from "@boeltech/cfdi-domain";
import { isClientTaxIdFormatInvalid } from "@boeltech/cfdi-domain/validadores/client";

import type { Client } from "../../domain";

/**
 * True si el RFC no cumple longitud/formato esperado por tipo SAT.
 * RFC genérico (XAXX / XEXX): no aplica; su régimen se revisa en `genericRfcTaxRegimeMismatch`.
 */
export function isClientTaxIdFormatSuspicious(client: Client): boolean {
  if (isGenericRfc(client.taxId)) return false;
  return isClientTaxIdFormatInvalid({
    type: client.type,
    taxId: client.taxId,
  });
}

/**
 * Cliente con RFC genérico cuyo régimen guardado el SAT rechazará (p. ej. XAXX + 626).
 * `null` si no aplica (RFC normal, solo comercial o régimen vacío/correcto).
 */
export function genericRfcTaxRegimeMismatch(
  client: Client,
): { kind: GenericRfcKind; currentTaxRegime: string } | null {
  if (client.cfdiReceptorProfile === "comercial_only") return null;
  const kind = classifyGenericRfc(client.taxId);
  if (!kind) return null;
  const result = validateGenericReceiverFiscal({
    receiverRfc: client.taxId,
    receiverTaxRegime: client.taxRegime,
  });
  if (result.ok) return null;
  return { kind, currentTaxRegime: client.taxRegime?.trim() ?? "" };
}

/**
 * Cliente a crédito sin límite explícito (riesgo operativo hasta integrar cuentas).
 */
export function isCreditExposureUndefinable(client: Client): boolean {
  return (
    client.paymentTerms === "credit" &&
    (client.creditLimit == null || client.creditLimit <= 0)
  );
}
