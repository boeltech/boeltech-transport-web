import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import { clientsCopy } from "../copy/clientsCopy";

const copy = clientsCopy.filter;

export interface ClientListFiltersProps {
  type: string;
  paymentTerms: string;
  status: string;
  activePanelFilterCount: number;
  onTypeChange: (value: string) => void;
  onPaymentTermsChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

/**
 * Recortes del catálogo de clientes (tipo / pago / estado).
 * Shell canónico: `ListingFilterPanel`. El lookup vive en el search.
 */
export function ClientListFilters({
  type,
  paymentTerms,
  status,
  activePanelFilterCount,
  onTypeChange,
  onPaymentTermsChange,
  onStatusChange,
}: ClientListFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="clients-filter-type">{copy.typeLabel}</Label>
        <Select value={type || "all"} onValueChange={onTypeChange}>
          <SelectTrigger
            id="clients-filter-type"
            className="w-full"
            aria-label={copy.typeLabel}
          >
            <SelectValue placeholder={copy.typeLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.typeAll}</SelectItem>
            <SelectItem value="company">{copy.typeMoral}</SelectItem>
            <SelectItem value="individual">{copy.typeIndividual}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clients-filter-payment">{copy.paymentLabel}</Label>
        <Select
          value={paymentTerms || "all"}
          onValueChange={onPaymentTermsChange}
        >
          <SelectTrigger
            id="clients-filter-payment"
            className="w-full"
            aria-label={copy.paymentLabel}
          >
            <SelectValue placeholder={copy.paymentLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.paymentAll}</SelectItem>
            <SelectItem value="cash">{copy.paymentCash}</SelectItem>
            <SelectItem value="credit">{copy.paymentCredit}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clients-filter-status">{copy.statusLabel}</Label>
        <Select value={status || "all"} onValueChange={onStatusChange}>
          <SelectTrigger
            id="clients-filter-status"
            className="w-full"
            aria-label={copy.statusLabel}
          >
            <SelectValue placeholder={copy.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.statusAll}</SelectItem>
            <SelectItem value="active">{copy.statusActive}</SelectItem>
            <SelectItem value="inactive">{copy.statusInactive}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
