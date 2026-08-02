import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  useFieldArray,
  useFormState,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { recomputeInvoiceAmountsFromConcepts, PERSONA_MORAL_RETAINED_IVA_RATE } from "@boeltech/cfdi-domain";
import { useBillingServiceConcepts } from "@features/settings/application/hooks/useBillingServiceConcepts";
import type { InvoiceBillingScope } from "@features/invoicing/domain";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { RHFMoneyField } from "@shared/ui/form";
import { Separator } from "@shared/ui/separator";
import { invoicingCopy } from "../copy/invoicingCopy";
import { InvoiceConceptLineSheet } from "./InvoiceConceptLineSheet";
import { InvoiceConceptLinesTable } from "./InvoiceConceptLinesTable";
import {
  type InvoiceConceptFormLine,
  type InvoiceFormValues,
} from "../validation/invoiceFormSchema";

const copy = invoicingCopy.concepts;

type ConceptsFormSlice = {
  concepts: InvoiceConceptFormLine[];
};

type InvoiceConceptsEditorProps = {
  control: Control<InvoiceFormValues>;
  setValue: UseFormSetValue<InvoiceFormValues>;
  taxRate: number;
  tripBaseRate?: number;
  retentionRequired?: boolean;
  billingScope?: InvoiceBillingScope;
  /** Descuento global: vive junto a los conceptos porque altera el cálculo. */
  showDiscount?: boolean;
};

export function InvoiceConceptsEditor({
  control,
  setValue,
  taxRate,
  tripBaseRate,
  retentionRequired = false,
  billingScope = "primary_transport",
  showDiscount = false,
}: InvoiceConceptsEditorProps) {
  const isAccessory = billingScope === "accessory";
  const conceptsControl = control as unknown as Control<ConceptsFormSlice>;
  const { data: catalogServices = [] } = useBillingServiceConcepts({
    isActive: true,
  });
  const watchedConcepts = useWatch({ control, name: "concepts" });
  const concepts = useMemo(
    () => (watchedConcepts ?? []) as InvoiceConceptFormLine[],
    [watchedConcepts],
  );
  const discount = useWatch({ control, name: "discount" }) ?? 0;
  const { fields, append, remove, update } = useFieldArray({
    control: conceptsControl,
    name: "concepts",
  });

  const { errors } = useFormState({ control });
  const conceptErrors = errors.concepts;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [sheetMode, setSheetMode] = useState<"create-service" | "edit">("edit");
  const [initialLine, setInitialLine] = useState<InvoiceConceptFormLine | null>(null);

  const errorIndices = useMemo(() => {
    if (!Array.isArray(conceptErrors)) return new Set<number>();
    const indices = new Set<number>();
    conceptErrors.forEach((entry, index) => {
      if (entry && Object.keys(entry).length > 0) indices.add(index);
    });
    return indices;
  }, [conceptErrors]);

  useEffect(() => {
    if (concepts.length === 0) return;

    const amounts = recomputeInvoiceAmountsFromConcepts(concepts, discount, {
      tasaIva: taxRate,
      retainedTaxRate: retentionRequired ? PERSONA_MORAL_RETAINED_IVA_RATE : 0,
    });

    setValue("subtotal", amounts.subtotal, { shouldValidate: true });
    setValue("total_tax", amounts.total_tax, { shouldValidate: true });
    setValue("retained_tax", amounts.retained_tax ?? 0, { shouldValidate: true });
    setValue("total", amounts.total, { shouldValidate: true });
    setValue(
      "apply_retained_tax",
      retentionRequired || (amounts.retained_tax ?? 0) > 0,
      { shouldValidate: false },
    );
  }, [concepts, discount, taxRate, retentionRequired, setValue]);

  const fleteLine = concepts.find((line) => line.concept_type === "flete");
  const fleteAmount = fleteLine?.amount ?? 0;
  const fleteMismatch =
    !isAccessory &&
    tripBaseRate != null &&
    tripBaseRate > 0 &&
    Math.abs(fleteAmount - tripBaseRate) >= 0.01;

  const tableLines = useMemo(
    () =>
      fields.map((field, index) => ({
        ...concepts[index],
        id: field.id,
      })),
    [fields, concepts],
  );

  const handleOpenCreate = () => {
    setSheetMode("create-service");
    setEditingIndex(null);
    setInitialLine(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    const line = concepts[index];
    if (!line) return;
    setSheetMode("edit");
    setEditingIndex(index);
    setInitialLine(line);
    setSheetOpen(true);
  };

  const handleApplyFromSheet = (
    values: InvoiceConceptFormLine,
    submittedIndex: number | null,
  ) => {
    if (submittedIndex !== null) {
      update(submittedIndex, values);
    } else {
      append(values);
    }
    setInitialLine(null);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {fleteMismatch ? (
        <AlertWithIcon variant="warning">
          {copy.fleteBaseRateWarning(tripBaseRate!, fleteAmount)}
        </AlertWithIcon>
      ) : null}

      <InvoiceConceptLinesTable
        lines={tableLines}
        onEdit={handleOpenEdit}
        onRemove={remove}
        errorIndices={errorIndices}
        billingScope={billingScope}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {concepts.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.conceptsCount(concepts.length)}
          </p>
        ) : (
          <span />
        )}
        <Button type="button" variant="outline" size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {copy.addConcept}
        </Button>
      </div>

      {showDiscount ? (
        <>
          <Separator />
          <div className="max-w-xs">
            <RHFMoneyField
              control={control}
              name="discount"
              label={invoicingCopy.label.discount}
              description={copy.discountHint}
            />
          </div>
        </>
      ) : null}

      <InvoiceConceptLineSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        initialValues={initialLine}
        editingIndex={editingIndex}
        catalogServices={catalogServices}
        taxRate={taxRate}
        retentionRequired={retentionRequired}
        onApply={handleApplyFromSheet}
      />
    </div>
  );
}
