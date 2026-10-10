import {
  classifyGenericRfc,
  resolveGenericReceiverDefaults,
  type GenericRfcKind,
} from "@boeltech/cfdi-domain";

export type GenericReceiverFieldChange = {
  field: "receiver_tax_regime" | "cfdi_usage";
  from: string;
  to: string;
};

export type GenericReceiverAdjustment = {
  kind: GenericRfcKind;
  receiverTaxRegime: string;
  cfdiUsage: string;
  /** Vacío si régimen y uso ya eran los del SAT. */
  changes: GenericReceiverFieldChange[];
};

/**
 * Valores del SAT para un receptor con RFC genérico y lo que cambia respecto a los actuales.
 * `null` si el RFC no es genérico (sin cambio de comportamiento).
 */
export function resolveGenericReceiverAdjustment(input: {
  receiverRfc: string | null | undefined;
  receiverTaxRegime: string | null | undefined;
  cfdiUsage: string | null | undefined;
}): GenericReceiverAdjustment | null {
  const kind = classifyGenericRfc(input.receiverRfc);
  const defaults = resolveGenericReceiverDefaults(input.receiverRfc);
  if (!kind || !defaults) return null;

  const currentTaxRegime = input.receiverTaxRegime?.trim() ?? "";
  const currentCfdiUsage = input.cfdiUsage?.trim() ?? "";
  const changes: GenericReceiverFieldChange[] = [];
  if (currentTaxRegime !== defaults.taxRegime) {
    changes.push({
      field: "receiver_tax_regime",
      from: currentTaxRegime,
      to: defaults.taxRegime,
    });
  }
  if (currentCfdiUsage !== defaults.cfdiUsage) {
    changes.push({
      field: "cfdi_usage",
      from: currentCfdiUsage,
      to: defaults.cfdiUsage,
    });
  }

  return {
    kind,
    receiverTaxRegime: defaults.taxRegime,
    cfdiUsage: defaults.cfdiUsage,
    changes,
  };
}
