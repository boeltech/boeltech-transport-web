import { Building2 } from "lucide-react";

import { AddressPicker } from "@shared/ui/address-picker";
import type {
  AddressSearchListItem,
  SearchableOwnerType,
} from "@shared/ui/address-picker/types";
import { FormSectionCard } from "@shared/ui/form-section-card";

import { wizardCopy } from "../../../../copy";

const copy = wizardCopy.route.stopForm.addressOrigin;

export interface StopFormSheetAddressOriginSectionProps {
  selectedPrefill: AddressSearchListItem | null;
  onPrefillSelect: (item: AddressSearchListItem) => void;
  onPrefillClear: () => void;
  defaultOwnerTypes?: SearchableOwnerType[];
  disabled?: boolean;
}

export function StopFormSheetAddressOriginSection({
  selectedPrefill,
  onPrefillSelect,
  onPrefillClear,
  defaultOwnerTypes,
  disabled = false,
}: StopFormSheetAddressOriginSectionProps) {
  return (
    <FormSectionCard
      title={copy.title}
      icon={<Building2 className="h-4 w-4" />}
      description={copy.description}
      contentClassName="space-y-3"
    >
      <AddressPicker
        value={selectedPrefill}
        onSelect={onPrefillSelect}
        onClear={onPrefillClear}
        label={copy.pickerLabel}
        placeholder={copy.pickerPlaceholder}
        disabled={disabled}
        defaultOwnerTypes={defaultOwnerTypes}
      />
    </FormSectionCard>
  );
}
