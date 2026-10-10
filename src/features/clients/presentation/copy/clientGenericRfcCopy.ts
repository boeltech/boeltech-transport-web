import {
  GENERIC_RECEIVER_TAX_REGIME,
  type GenericRfcKind,
} from "@boeltech/cfdi-domain";

const audience = (kind: GenericRfcKind) =>
  kind === "foreign" ? "residentes en el extranjero" : "público en general";

/** Copy del RFC genérico (XAXX / XEXX) en alta, edición y ficha del cliente. */
export const clientGenericRfcCopy = {
  form: {
    title: (kind: GenericRfcKind) =>
      kind === "foreign"
        ? "RFC genérico de residente en el extranjero"
        : "RFC de público en general",
    /** `taxRegimeLabel` = «616 · Sin obligaciones fiscales» (catálogo). */
    body: (kind: GenericRfcKind, taxRegimeLabel: string) =>
      kind === "foreign"
        ? `El SAT solo acepta régimen ${taxRegimeLabel} para este RFC. El sistema aún no captura la residencia fiscal ni el número de registro tributario del extranjero.`
        : `El SAT solo acepta régimen ${taxRegimeLabel} para este RFC. Usa el nombre comercial para distinguir este cliente.`,
    regimeChanged: (previousCode: string) =>
      `Cambiamos el régimen de ${previousCode} a ${GENERIC_RECEIVER_TAX_REGIME}.`,
    lockedHelp: (kind: GenericRfcKind) =>
      `Fijado por el SAT para ${audience(kind)}.`,
    editCorrectedTitle: "Corregimos el régimen de este cliente",
    editCorrectedBody: (
      kind: GenericRfcKind,
      previousCode: string,
      taxRegimeLabel: string,
    ) =>
      `Tenía ${previousCode}; para ${audience(kind)} debe ser ${taxRegimeLabel}. Guarda para aplicar el cambio.`,
    leftGeneric: "Ya no es público en general: elige el régimen del RFC nuevo.",
  },
  detail: {
    wrongRegimeTitle: (kind: GenericRfcKind) =>
      `Régimen incorrecto para ${audience(kind)}`,
    wrongRegimeText: (currentCode: string, taxRegimeLabel: string) =>
      `Este cliente tiene régimen ${currentCode}. El SAT rechazará sus facturas hasta que sea ${taxRegimeLabel}.`,
    wrongRegimeCta: "Corregir régimen",
  },
} as const;
