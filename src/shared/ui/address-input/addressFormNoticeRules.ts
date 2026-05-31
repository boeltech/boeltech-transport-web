import type { AddressFormUiContext } from "./addressFormCopy";
import type { AddressUxVariant } from "@shared/validation/addressRequirements";

export type AddressFormNoticeLevel = "error" | "warning" | "info";

export interface AddressFormNoticeRuleState {
  context: AddressFormUiContext;
  addressVariant?: AddressUxVariant;
  addressType?: string | null;
  satStateCode?: string;
  satMunicipalityCode?: string;
  postalCode?: string;
}

export interface AddressFormNoticeData {
  level: AddressFormNoticeLevel;
  message: string;
}

export function resolveAddressFormNotice(
  _state: AddressFormNoticeRuleState,
  infoMessage: string,
): AddressFormNoticeData | null {
  // Obligatoriedad y municipio recomendado: solo FieldInlineError + label en AddressInput.
  // El banner global queda para copy de contexto (billing, parada, etc.).
  const trimmedInfo = infoMessage.trim();
  if (!trimmedInfo) {
    return null;
  }
  return {
    level: "info",
    message: trimmedInfo,
  };
}
