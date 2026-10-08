import type { SettlementTemplateSuperseded } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.templateSuperseded;

/** Mismo texto en el tooltip de «Por pagar» y en el aviso de la preliquidación. */
export function resolveTemplateSupersededText(superseded: SettlementTemplateSuperseded): string {
  const { templateName: name, templateVersion: version, replacedBy } = superseded;
  if (!replacedBy) {
    return copy.bodyNoReplacement({ name, version });
  }
  const replacement =
    replacedBy.templateName === name
      ? copy.replacementSameName(replacedBy.templateVersion)
      : copy.replacementRenamed(replacedBy.templateName, replacedBy.templateVersion);
  return copy.body({ name, version, replacement });
}

export function resolveTemplateSupersededAlert(superseded: SettlementTemplateSuperseded): {
  title: string;
  body: string;
} {
  return { title: copy.title, body: resolveTemplateSupersededText(superseded) };
}
