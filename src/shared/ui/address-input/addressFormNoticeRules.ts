import type { AddressFormUiContext } from "./addressFormCopy";

export type AddressFormNoticeLevel = "error" | "warning" | "info";

export interface AddressFormNoticeRuleState {
  context: AddressFormUiContext;
  satStateCode?: string;
  satMunicipalityCode?: string;
  postalCode?: string;
  hasClientFiscalData?: boolean;
  useClientFiscalData?: boolean;
}

export interface AddressFormNoticeData {
  level: AddressFormNoticeLevel;
  message: string;
}

export function resolveAddressFormNotice(
  state: AddressFormNoticeRuleState,
  infoMessage: string,
): AddressFormNoticeData | null {
  const missingCritical =
    !state.satStateCode || !state.satMunicipalityCode || !state.postalCode;

  if (missingCritical) {
    return {
      level: "error",
      message:
        "Faltan datos SAT obligatorios para continuar: Estado, Municipio y Codigo Postal.",
    };
  }

  if (state.hasClientFiscalData && state.useClientFiscalData === false) {
    return {
      level: "warning",
      message:
        "Estas usando remitente/destinatario manual. Verifica RFC y nombre antes de guardar.",
    };
  }

  return {
    level: "info",
    message: infoMessage,
  };
}

