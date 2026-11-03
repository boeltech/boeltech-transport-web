/**
 * Select Tipo del workbench Envíos (Todos | Facturas | REPs).
 * Label visible; opciones sin prefijo «Tipo:» (el chip activo sí lo usa).
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
    <div className="space-y-1.5">
      <Label htmlFor={id}>{copy.label}</Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as DispatchDocumentKindFilter)}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-label={copy.ariaLabel}
        >
          <SelectValue placeholder={copy.label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{copy.all}</SelectItem>
          <SelectItem value="invoice">{copy.invoice}</SelectItem>
          <SelectItem value="rep">{copy.rep}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
