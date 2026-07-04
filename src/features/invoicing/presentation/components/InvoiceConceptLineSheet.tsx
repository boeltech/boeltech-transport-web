import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductoServicioCPSearch, UnidadMedidaSearch } from "@features/catalogs";
import type { BillingServiceConcept } from "@features/settings/domain/billingServiceConcept.types";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  FormFieldShell,
  FormValidationSummary,
  MoneyInput,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  INVOICE_CONCEPT_SHEET_BODY_CLASS,
  INVOICE_CONCEPT_SHEET_CONTENT_CLASS,
  INVOICE_CONCEPT_SHEET_FOOTER_CLASS,
  INVOICE_CONCEPT_SHEET_HEADER_CLASS,
  INVOICE_CONCEPT_SHEET_PRIMARY_BUTTON_CLASS,
} from "./invoiceConceptSheetLayout";
import {
  applyConceptTaxFlags,
  invoiceConceptFormSchema,
  readConceptTaxFlags,
  type InvoiceConceptFormLine,
} from "../validation/invoiceFormSchema";

const copy = invoicingCopy.concepts;
const sheetCopy = copy.sheet;

export type InvoiceConceptSheetMode = "create-service" | "edit";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function syncLineAmount(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

function countServiceLinesBefore(
  concepts: InvoiceConceptFormLine[],
  index: number,
): number {
  return concepts.slice(0, index).filter((line) => line.concept_type === "service")
    .length;
}

function buildEmptyServiceLine(taxRate: number): InvoiceConceptFormLine {
  return {
    concept_type: "service",
    clave_prod_serv: "78121603",
    clave_unidad: "E48",
    unidad: "Servicio",
    description: "",
    quantity: 1,
    unit_price: 0,
    amount: 0,
    ...applyConceptTaxFlags(true, false, taxRate),
  };
}

export interface InvoiceConceptLineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: InvoiceConceptSheetMode;
  initialValues: InvoiceConceptFormLine | null;
  editingIndex: number | null;
  allConcepts: InvoiceConceptFormLine[];
  catalogServices: BillingServiceConcept[];
  taxRate: number;
  onApply: (values: InvoiceConceptFormLine, editingIndex: number | null) => void;
}

export function InvoiceConceptLineSheet({
  open,
  onOpenChange,
  mode,
  initialValues,
  editingIndex,
  allConcepts,
  catalogServices,
  taxRate,
  onApply,
}: InvoiceConceptLineSheetProps) {
  const [showSummary, setShowSummary] = useState(false);

  const defaultValues = useMemo<DefaultValues<InvoiceConceptFormLine>>(() => {
    if (initialValues) return { ...initialValues };
    return buildEmptyServiceLine(taxRate);
  }, [initialValues, taxRate]);

  const form = useForm<InvoiceConceptFormLine>({
    resolver: zodResolver(invoiceConceptFormSchema) as Resolver<InvoiceConceptFormLine>,
    defaultValues,
    mode: "onSubmit",
  });

  const { control, handleSubmit, reset, setValue, getValues, formState } = form;
  const conceptType = useWatch({ control, name: "concept_type" });
  const isFlete = conceptType === "flete";
  const quantity = useWatch({ control, name: "quantity" }) ?? 0;
  const unitPrice = useWatch({ control, name: "unit_price" }) ?? 0;
  const amount = useWatch({ control, name: "amount" }) ?? 0;
  const ivaRate = useWatch({ control, name: "iva_rate" }) ?? 0;
  const retainedIvaRate = useWatch({ control, name: "retained_iva_rate" }) ?? 0;
  const taxFlags = readConceptTaxFlags({
    iva_rate: ivaRate,
    retained_iva_rate: retainedIvaRate,
  });

  const applyTaxFlags = (ivaAplica: boolean, retencionAplica: boolean) => {
    const flags = applyConceptTaxFlags(ivaAplica, retencionAplica, taxRate);
    setValue("iva_rate", flags.iva_rate);
    setValue("retained_iva_rate", flags.retained_iva_rate);
    setValue("object_imp", flags.object_imp);
  };

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
  }, [open, defaultValues, reset]);

  const handleSheetOpenChange = (next: boolean) => {
    if (!next) setShowSummary(false);
    onOpenChange(next);
  };

  const sheetTitle = useMemo(() => {
    if (mode === "create-service") return sheetCopy.createTitle;
    if (isFlete) return sheetCopy.editFleteTitle;
    const serviceNumber =
      editingIndex != null
        ? countServiceLinesBefore(allConcepts, editingIndex) + 1
        : 1;
    return sheetCopy.editServiceTitle(serviceNumber);
  }, [mode, isFlete, editingIndex, allConcepts]);

  const sheetDescription = isFlete ? copy.fleteHint : copy.serviceHint;

  const summaryMessages = collectFieldErrorMessages(formState.errors);

  const submitSheet = handleSubmit(
    (values) => {
      onApply(values, editingIndex);
      handleSheetOpenChange(false);
    },
    () => {
      setShowSummary(true);
    },
  );

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className={INVOICE_CONCEPT_SHEET_CONTENT_CLASS} side="right">
        <SheetHeader className={INVOICE_CONCEPT_SHEET_HEADER_CLASS}>
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        <div className={INVOICE_CONCEPT_SHEET_BODY_CLASS}>
          {!isFlete ? (
            <Controller
              control={control}
              name="service_concept_id"
              render={({ field: svcField }) => (
                <FormFieldShell fieldId="concept-sheet-catalog" label={copy.catalogLabel}>
                  <Select
                    value={String(svcField.value ?? "__none__")}
                    onValueChange={(value) => {
                      if (value === "__none__") {
                        svcField.onChange(undefined);
                        return;
                      }
                      const selected = catalogServices.find((s) => s.id === value);
                      svcField.onChange(value);
                      if (!selected) return;
                      setValue("clave_prod_serv", selected.claveProdServ);
                      setValue("clave_unidad", selected.claveUnidad);
                      setValue("unidad", selected.unidad);
                      setValue("description", selected.name);
                      const flags = applyConceptTaxFlags(
                        selected.ivaAplica,
                        selected.retencionAplica,
                        taxRate,
                      );
                      setValue("iva_rate", flags.iva_rate);
                      setValue("retained_iva_rate", flags.retained_iva_rate);
                      setValue("object_imp", flags.object_imp);
                      if (selected.defaultUnitPrice != null) {
                        setValue("unit_price", selected.defaultUnitPrice);
                        const qty = getValues("quantity") ?? 1;
                        setValue("amount", syncLineAmount(qty, selected.defaultUnitPrice));
                      }
                    }}
                  >
                    <SelectTrigger id="concept-sheet-catalog">
                      <SelectValue placeholder={copy.catalogPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{copy.catalogManual}</SelectItem>
                      {catalogServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {catalogServices.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {copy.catalogEmpty}{" "}
                      <Link
                        to="/settings/billing/service-concepts"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {copy.catalogEmptyLink}
                      </Link>
                    </p>
                  ) : null}
                </FormFieldShell>
              )}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              control={control}
              name="clave_prod_serv"
              render={({ field: claveField, fieldState }) => (
                <FormFieldShell
                  fieldId="concept-sheet-clave"
                  label={copy.claveProdServ}
                  errorMessage={fieldState.error?.message}
                >
                  <ProductoServicioCPSearch
                    value={String(claveField.value ?? "")}
                    onSelect={(item) => claveField.onChange(item.code)}
                  />
                </FormFieldShell>
              )}
            />
            <Controller
              control={control}
              name="clave_unidad"
              render={({ field: unidadField, fieldState }) => (
                <FormFieldShell
                  fieldId="concept-sheet-unidad"
                  label={copy.claveUnidad}
                  errorMessage={fieldState.error?.message}
                >
                  <UnidadMedidaSearch
                    value={String(unidadField.value ?? "")}
                    onSelect={(item) => {
                      unidadField.onChange(item.code);
                      setValue("unidad", item.name || getValues("unidad") || "Servicio");
                    }}
                  />
                </FormFieldShell>
              )}
            />
          </div>

          <Controller
            control={control}
            name="description"
            render={({ field: descField, fieldState }) => (
              <FormFieldShell
                fieldId="concept-sheet-description"
                label={copy.description}
                errorMessage={fieldState.error?.message}
              >
                <Input
                  id="concept-sheet-description"
                  {...descField}
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps(
                    "concept-sheet-description",
                    fieldState.error?.message,
                  )}
                />
              </FormFieldShell>
            )}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Controller
              control={control}
              name="quantity"
              render={({ field: qtyField, fieldState }) => (
                <FormFieldShell
                  fieldId="concept-sheet-quantity"
                  label={copy.quantity}
                  errorMessage={fieldState.error?.message}
                >
                  <Input
                    id="concept-sheet-quantity"
                    type="number"
                    min={0}
                    step="0.01"
                    value={qtyField.value}
                    onChange={(e) => {
                      const nextQuantity = Number(e.target.value) || 0;
                      qtyField.onChange(nextQuantity);
                      setValue("amount", syncLineAmount(nextQuantity, unitPrice));
                    }}
                    error={Boolean(fieldState.error)}
                  />
                </FormFieldShell>
              )}
            />
            <Controller
              control={control}
              name="unit_price"
              render={({ field: priceField, fieldState }) => (
                <FormFieldShell
                  fieldId="concept-sheet-unit-price"
                  label={copy.unitPrice}
                  errorMessage={fieldState.error?.message}
                >
                  <MoneyInput
                    id="concept-sheet-unit-price"
                    value={priceField.value}
                    onValueChange={(nextUnitPrice) => {
                      const resolved = nextUnitPrice ?? 0;
                      priceField.onChange(resolved);
                      setValue("amount", syncLineAmount(quantity, resolved));
                    }}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "concept-sheet-unit-price",
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />
            <FormFieldShell fieldId="concept-sheet-amount" label={copy.amount}>
              <div
                id="concept-sheet-amount"
                className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium tabular-nums"
              >
                {formatMxCurrency(amount)}
              </div>
            </FormFieldShell>
          </div>

          <div className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
            <div>
              <p className="text-sm font-medium">{sheetCopy.taxesHeading}</p>
              <p className="text-xs text-muted-foreground">{sheetCopy.taxesHint}</p>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={taxFlags.ivaAplica}
                  onCheckedChange={(checked) =>
                    applyTaxFlags(Boolean(checked), taxFlags.retencionAplica)
                  }
                />
                {sheetCopy.ivaAplica}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={taxFlags.retencionAplica}
                  onCheckedChange={(checked) =>
                    applyTaxFlags(taxFlags.ivaAplica, Boolean(checked))
                  }
                />
                {sheetCopy.retencionAplica}
              </label>
            </div>
          </div>

          <Controller
            control={control}
            name="concept_type"
            render={({ field: typeField }) => <input type="hidden" {...typeField} />}
          />

          {showSummary && summaryMessages.length > 0 ? (
            <FormValidationSummary
              title={sheetCopy.validationSummary}
              messages={summaryMessages}
            />
          ) : null}
        </div>

        <SheetFooter className={INVOICE_CONCEPT_SHEET_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={() => handleSheetOpenChange(false)}>
            {sheetCopy.close}
          </Button>
          <Button
            type="button"
            className={INVOICE_CONCEPT_SHEET_PRIMARY_BUTTON_CLASS}
            onClick={() => void submitSheet()}
          >
            {sheetCopy.apply}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
