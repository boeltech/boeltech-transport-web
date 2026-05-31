import { Receipt } from "lucide-react";

import type { EntityAddressFormSection } from "@shared/ui/address-input";

import {
  LUGAR_EXPEDICION_SECTION_ID,
  LugarExpedicionSectionContent,
  LugarExpedicionSectionTitle,
  type LugarExpedicionSectionContentProps,
} from "./LugarExpedicionFormSection";

/** Misma presentación que «Ubicación en mapa»: `FormSectionCard` vía `EntityAddressForm`. */
export function buildLugarExpedicionEntityFormSection(
  props: LugarExpedicionSectionContentProps,
): EntityAddressFormSection {
  return {
    id: LUGAR_EXPEDICION_SECTION_ID,
    title: <LugarExpedicionSectionTitle />,
    icon: <Receipt className="h-4 w-4" />,
    contentClassName: "space-y-4",
    content: <LugarExpedicionSectionContent {...props} />,
  };
}
