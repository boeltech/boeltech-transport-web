import { MapPin } from "lucide-react";

import {
  AddressGeocodingSectionContent,
  AddressGeocodingSectionTitle,
  GEOCODING_SECTION_ID,
  type AddressGeocodingSectionContentProps,
} from "./AddressGeocodingFormSection";
import type { EntityAddressFormSection } from "./EntityAddressForm";

/** Misma presentación que secciones operativas: `FormSectionCard` vía `EntityAddressForm`. */
export function buildGeocodingEntityFormSection(
  props: AddressGeocodingSectionContentProps,
): EntityAddressFormSection {
  return {
    id: GEOCODING_SECTION_ID,
    title: <AddressGeocodingSectionTitle />,
    icon: <MapPin className="h-4 w-4" />,
    contentClassName: "space-y-4",
    content: <AddressGeocodingSectionContent {...props} />,
  };
}
