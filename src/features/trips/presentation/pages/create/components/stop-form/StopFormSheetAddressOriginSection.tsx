import { Building2 } from "lucide-react";

import { isAllowedRoutePickerItem } from "@features/trips/presentation/components/trip-route/routeAddressPickerOwnerTypes";
import type {
  AddressSearchListItem,
  SearchableOwnerType,
} from "@shared/ui/address-picker/types";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  LocationField,
  locationValueFromInternal,
  locationValueToAddressSearchListItem,
  type LocationValue,
} from "@shared/ui/location";

import { wizardCopy } from "../../../../copy";

const copy = wizardCopy.route.stopForm.addressOrigin;

export interface StopFormSheetAddressOriginSectionProps {
  selectedPrefill: AddressSearchListItem | null;
  onPrefillSelect: (item: AddressSearchListItem) => void;
  /** Mapbox / create drafts without catalog ids (ADR-0092). */
  onLocationDraft: (value: LocationValue) => void;
  onPrefillClear: () => void;
  defaultOwnerTypes?: SearchableOwnerType[];
  clientId?: string | null;
  disabled?: boolean;
}

export function StopFormSheetAddressOriginSection({
  selectedPrefill,
  onPrefillSelect,
  onLocationDraft,
  onPrefillClear,
  defaultOwnerTypes,
  clientId,
  disabled = false,
}: StopFormSheetAddressOriginSectionProps) {
  const handleChange = (value: LocationValue | null) => {
    if (!value) {
      onPrefillClear();
      return;
    }
    const item = locationValueToAddressSearchListItem(value);
    if (item) {
      onPrefillSelect(item);
      return;
    }
    onLocationDraft(value);
  };

  return (
    <FormSectionCard
      title={copy.title}
      icon={<Building2 className="h-4 w-4" />}
      description={copy.description}
      contentClassName="space-y-3"
    >
      <LocationField
        context="tripStop"
        value={selectedPrefill ? locationValueFromInternal(selectedPrefill) : null}
        onChange={handleChange}
        label={copy.pickerLabel}
        placeholder={copy.pickerPlaceholder}
        disabled={disabled}
        clientId={clientId}
        ownerTypes={defaultOwnerTypes}
        filterItem={isAllowedRoutePickerItem}
      />
    </FormSectionCard>
  );
}
