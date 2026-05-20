import type { AddressFormUiContext } from "./addressFormCopy";
import type { AddressCaptureMode } from "@shared/validation/addressRequirements";
import { resolveAddressModeRequirements } from "@shared/validation/addressRequirements";

export type AddressFormNoticeLevel = "error" | "warning" | "info";

export interface AddressFormNoticeRuleState {
  context: AddressFormUiContext;
  addressMode?: AddressCaptureMode;
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
  const requirements = resolveAddressModeRequirements(state.addressMode ?? "basic");
  const missingState = !state.satStateCode?.trim();
  const missingPostalCode = !state.postalCode?.trim();
  const missingMunicipality =
    requirements.requireMunicipality && !state.satMunicipalityCode?.trim();
  const missingCritical = missingState || missingPostalCode || missingMunicipality;

  if (missingCritical) {
    const criticalLabels = ["Estado", "Codigo Postal"];
    if (requirements.requireMunicipality) criticalLabels.splice(1, 0, "Municipio");
    return {
      level: "error",
      message: `Faltan datos SAT obligatorios para continuar: ${criticalLabels.join(", ")}.`,
    };
  }

  if (state.hasClientFiscalData && state.useClientFiscalData === false) {
    return {
      level: "warning",
      message:
        "Estas usando remitente/destinatario manual. Verifica RFC y nombre antes de guardar.",
    };
  }

  const trimmedInfo = infoMessage.trim();
  if (!trimmedInfo) {
    return null;
  }
  return {
    level: "info",
    message: trimmedInfo,
  };
}

