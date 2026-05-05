import type { Client } from "../../domain";

const RFC_SHAPE = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

/**
 * True si el RFC no cumple longitud/formato esperado por tipo SAT.
 */
export function isClientTaxIdFormatSuspicious(client: Client): boolean {
  const raw = client.taxId?.trim() ?? "";
  if (!raw) return true;
  const rfc = raw.toUpperCase();
  if (!RFC_SHAPE.test(rfc)) return true;
  if (client.type === "company" && rfc.length !== 12) return true;
  if (client.type === "individual" && rfc.length !== 13) return true;
  return false;
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
