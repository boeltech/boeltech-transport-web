import { isClientTaxIdFormatInvalid } from "@boeltech/cfdi-domain/validadores/client";

import type { Client } from "../../domain";

/**
 * True si el RFC no cumple longitud/formato esperado por tipo SAT.
 */
export function isClientTaxIdFormatSuspicious(client: Client): boolean {
  return isClientTaxIdFormatInvalid({
    type: client.type,
    taxId: client.taxId,
  });
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
