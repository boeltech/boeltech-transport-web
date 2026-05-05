import type { ReactNode } from "react";
import type { Control, FieldValues } from "react-hook-form";

export type AddressInputMode = "cfdi" | "carta-porte" | "personal" | "basic";

export type AddressInputLayout = "single-column" | "two-column" | "compact";

export interface SavedAddressOption {
  id: string;
  label: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  reference?: string | null;
  postalCode: string;
  satCountryCode: string;
  satStateCode: string;
  satMunicipalityCode: string;
  satLocalityCode?: string | null;
  satNeighborhoodCode?: string | null;
  neighborhoodName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary?: boolean;
}

export interface AddressInputProps<TFieldValues extends FieldValues = FieldValues> {
  mode: AddressInputMode;
  control: Control<TFieldValues>;
  namePrefix: string;
  savedAddresses?: SavedAddressOption[];
  onSelectSaved?: (address: SavedAddressOption) => void;
  layout?: AddressInputLayout;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showLatLng?: boolean;
  showPrimaryToggle?: boolean;
  extraSlots?: {
    beforeAddress?: ReactNode;
    afterAddress?: ReactNode;
  };
  autoFocusFirstField?: boolean;
  onCartaPorteReadyChange?: (ready: boolean) => void;
  disabled?: boolean;
  /** Oculta avisos informativos del lookup SAT por CP (p. ej. al precargar desde catálogo de cliente). */
  hideInformativeAlerts?: boolean;
}
