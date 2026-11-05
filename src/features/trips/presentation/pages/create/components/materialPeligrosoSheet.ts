import type { MaterialPeligrosoCatalogRequirement } from "@boeltech/cfdi-domain";

import { cargoCopy } from "../../../copy/wizard/cargoCopy";

const hint = cargoCopy.sheet.hint;

/**
 * Línea bajo el interruptor de material peligroso.
 * `unknown` se muestra como aviso: guardar sigue, el timbrado no.
 */
export function materialPeligrosoSheetHint(
  requirement: MaterialPeligrosoCatalogRequirement,
  hazardousMaterial: boolean,
): string {
  switch (requirement) {
    case "omit":
      return hint.materialPeligrosoOmit;
    case "declare_optional":
      return hazardousMaterial
        ? hint.materialPeligrosoOptionalOn
        : hint.materialPeligrosoOptionalOff;
    case "declare_required_si":
      return hint.hazmatRequired;
    case "unknown":
      return hint.materialPeligrosoUnknown;
  }
}

/**
 * `off` / `on`: el interruptor queda fijo (marca `0` o `1`).
 * `null`: la persona lo decide (marca `0,1` o sin marca).
 */
export function materialPeligrosoSwitchLock(
  requirement: MaterialPeligrosoCatalogRequirement | null,
): "off" | "on" | null {
  if (requirement === "omit") return "off";
  if (requirement === "declare_required_si") return "on";
  return null;
}
