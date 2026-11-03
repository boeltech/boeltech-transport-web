/**
 * Chip/filtro Tipo del workbench Envíos: Todos | Facturas | Comprobantes de pago (REP).
 */

import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import type { DispatchDocumentKindFilter } from "@features/invoicing/domain";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.workbench.typeFilter;

export interface FinanceDispatchDocumentKindFilterProps {
  value: DispatchDocumentKindFilter;
  onChange: (value: DispatchDocumentKindFilter) => void;
  id?: string;
}

export function FinanceDispatchDocumentKindFilter({
  value,
  onChange,
  id = "dispatch-document-kind",
}: FinanceDispatchDocumentKindFilterProps) {
  return (
    <div className="flex min-w-[11rem] flex-col gap-1.5">
      <Label htmlFor={id} className="sr-only">
        {copy.label}
      </Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as DispatchDocumentKindFilter)}
      >
        <SelectTrigger
          id={id}
          className="w-full sm:w-[14rem]"
          aria-label={copy.ariaLabel}
        >
          <SelectValue placeholder={copy.label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {copy.chip(copy.all)}
          </SelectItem>
          <SelectItem value="invoice">
            {copy.chip(copy.invoice)}
          </SelectItem>
          <SelectItem value="rep">
            {copy.chip(copy.rep)}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
