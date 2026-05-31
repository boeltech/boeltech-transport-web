import type { ReactNode } from "react";
import type { Control, FieldValues, UseFormSetValue } from "react-hook-form";
import type { AddressUxVariant } from "@shared/validation/addressRequirements";
import type { AddressFormUiContext } from "./addressFormCopy";

export type AddressInputVariant = AddressUxVariant;

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
  localityName?: string | null;
  satNeighborhoodCode?: string | null;
  neighborhoodName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary?: boolean;
}

export interface AddressInputProps<TFieldValues extends FieldValues = FieldValues> {
  /** Variante UX (readiness, recomendación municipio). SAT al guardar = XSD CP31 vía `formContext`. */
  variant: AddressInputVariant;
  /**
   * Perfil UX (asteriscos) alineado a `ADDRESS_FORM_PARSE_PROFILES` / `parseAddressFormCreate`.
   */
  formContext?: AddressFormUiContext;
  /** `addressType` del formulario; tiene prioridad sobre el default de `formContext`. */
  addressType?: string | null;
  control: Control<TFieldValues>;
  /** Necesario para la lista `savedAddresses`; patchea todos los campos de dirección. */
  setValue?: UseFormSetValue<TFieldValues>;
  namePrefix: string;
  savedAddresses?: SavedAddressOption[];
  onSelectSaved?: (address: SavedAddressOption) => void;
  layout?: AddressInputLayout;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /** Latitud/longitud manuales en el bloque domicilio (default: true). Usar `showLatLng={false}` solo si otro UI captura coords. */
  showLatLng?: boolean;
  showPrimaryToggle?: boolean;
  extraSlots?: {
    beforeAddress?: ReactNode;
    afterAddress?: ReactNode;
  };
  autoFocusFirstField?: boolean;
  onCartaPorteReadyChange?: (ready: boolean) => void;
  disabled?: boolean;
  /**
   * Sobreescribe `disabled` solo para los inputs `latitude` / `longitude`.
   * Útil cuando se precarga una dirección desde catálogo (todo el resto disabled),
   * pero la dirección no tiene coordenadas y el usuario debe capturarlas.
   * Si no se pasa, hereda de `disabled`.
   */
  disableCoordinates?: boolean;
  /** Oculta avisos informativos del lookup SAT por CP (p. ej. al precargar desde catálogo de cliente). */
  hideInformativeAlerts?: boolean;
  /**
   * Sin borde/padding propio: usar cuando el padre ya provee un Card o sección
   * (p. ej. SettingsCard + EntityAddressForm con hideLocationSectionTitle).
   */
  embedded?: boolean;
}
