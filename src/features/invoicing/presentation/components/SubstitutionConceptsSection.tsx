import { ChevronDown } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { HintIcon } from "@shared/ui/hint-icon";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";
import type { SubstituteInvoiceSheetValues } from "../validation/substitutionCorrectionsSchema";
import { invoicingCopy } from "../copy/invoicingCopy";
import { InvoiceConceptsEditor } from "./InvoiceConceptsEditor";
import {
  SUBSTITUTION_COLLAPSIBLE_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS,
  SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS,
} from "./substitutionSheetLayout";

const copy = invoicingCopy.detail.substitute.concepts;
const sheetCopy = invoicingCopy.detail.substitute;

interface Props {
  control: Control<SubstituteInvoiceSheetValues>;
  setValue: UseFormSetValue<SubstituteInvoiceSheetValues>;
  taxRate: number;
  retentionRequired?: boolean;
}

/**
 * Sección colapsable para editar partidas del sustituto reutilizando
 * `InvoiceConceptsEditor` (ADR-0061 x ADR-0051 §6.1). Las partidas son la
 * fuente de verdad: la API recalcula agregados y sincroniza `base_rate`.
 */
export function SubstitutionConceptsSection({
  control,
  setValue,
  taxRate,
  retentionRequired = false,
}: Props) {
  return (
    <Collapsible defaultOpen={false} className={SUBSTITUTION_COLLAPSIBLE_CLASS}>
      <CollapsibleTrigger className={SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS}>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>{copy.sectionTitle}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {sheetCopy.optionalBadge}
          </span>
        </span>
        <ChevronDown className={SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS} />
      </CollapsibleTrigger>
      <CollapsibleContent className={SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS}>
        <div className="flex items-start gap-1 text-xs text-muted-foreground">
          <p className="min-w-0 flex-1">{copy.sectionHint}</p>
          <HintIcon label={sheetCopy.sectionHintMoreLabel}>
            {copy.sectionHintDetail}
          </HintIcon>
        </div>
        <InvoiceConceptsEditor
          control={control as unknown as Control<InvoiceFormValues>}
          setValue={setValue as unknown as UseFormSetValue<InvoiceFormValues>}
          taxRate={taxRate}
          retentionRequired={retentionRequired}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
