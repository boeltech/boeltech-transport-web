import { useMemo } from "react";
import { FileText, Pencil } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";
import {
  CatalogTypeCode,
  useCatalogOptions,
  type CatalogTypeCodeValue,
} from "@features/catalogs";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { cn } from "@shared/lib/utils/cn";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";
import { InvoiceDualLabel } from "./InvoiceDualLabel";

const dual = invoicingCopy.labelDual;
const comprobanteCopy = invoicingCopy.comprobante;

/** Nombre humano del código SAT; si el catálogo no responde, se muestra el código. */
function useCatalogName(
  typeCode: CatalogTypeCodeValue,
  code: string | undefined,
): string {
  const trimmed = code?.trim() ?? "";
  const { data } = useCatalogOptions(typeCode, { enabled: Boolean(trimmed) });

  return useMemo(() => {
    if (!trimmed) return "";
    const match = data?.find((option) => option.code === trimmed);
    return match?.name?.trim() || trimmed;
  }, [data, trimmed]);
}

export interface InvoiceFiscalComprobanteCardProps {
  control: Control<InvoiceFormValues>;
  /** Abre el sheet «Corregir datos fiscales». */
  onEdit: () => void;
}

function displayFiscalValue(value: string | undefined, mono?: boolean) {
  const trimmed = value?.trim() ?? "";
  const isEmpty = trimmed.length === 0;
  return (
    <span
      className={cn(
        "break-words hyphens-none",
        mono && "font-mono",
        isEmpty && "italic text-muted-foreground",
      )}
    >
      {isEmpty ? "—" : trimmed}
    </span>
  );
}

/**
 * Resumen legible de los datos fiscales del receptor.
 * Grid 2 cols + InfoRow stacked: el label dual y el nombre SAT no compiten
 * en la misma fila (inline recorta valores largos en el panel del alta).
 */
export function InvoiceFiscalComprobanteCard({
  control,
  onEdit,
}: InvoiceFiscalComprobanteCardProps) {
  const taxRegime = useWatch({ control, name: "receiver_tax_regime" });
  const postalCode = useWatch({ control, name: "receiver_postal_code" });
  const cfdiUsage = useWatch({ control, name: "cfdi_usage" });
  const paymentForm = useWatch({ control, name: "payment_form" });
  const paymentMethod = useWatch({ control, name: "payment_method" });

  const taxRegimeName = useCatalogName(
    CatalogTypeCode.SAT_REGIMEN_FISCAL as CatalogTypeCodeValue,
    taxRegime,
  );
  const cfdiUsageName = useCatalogName(
    CatalogTypeCode.SAT_USO_CFDI as CatalogTypeCodeValue,
    cfdiUsage,
  );
  const paymentFormName = useCatalogName(
    CatalogTypeCode.SAT_FORMA_PAGO as CatalogTypeCodeValue,
    paymentForm,
  );
  const paymentMethodName = useCatalogName(
    CatalogTypeCode.SAT_METODO_PAGO as CatalogTypeCodeValue,
    paymentMethod,
  );

  const paymentSummary =
    paymentMethodName && paymentFormName
      ? comprobanteCopy.paymentSummary(paymentMethodName, paymentFormName)
      : paymentMethodName || paymentFormName;

  return (
    <FormSectionCard
      title={comprobanteCopy.title}
      description={comprobanteCopy.description}
      icon={<FileText className="h-4 w-4" />}
      action={
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          {comprobanteCopy.edit}
        </Button>
      }
      contentClassName="pt-0"
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <InfoRow
          className="min-w-0"
          label={
            <InvoiceDualLabel
              primary={dual.taxRegime}
              sat={dual.taxRegimeSat}
            />
          }
          value={displayFiscalValue(taxRegimeName)}
        />
        <InfoRow
          className="min-w-0"
          label={
            <InvoiceDualLabel
              primary={dual.cfdiUsage}
              sat={dual.cfdiUsageSat}
            />
          }
          value={displayFiscalValue(cfdiUsageName)}
        />
        <InfoRow
          className="min-w-0"
          label={
            <InvoiceDualLabel
              primary={dual.postalCode}
              sat={dual.postalCodeSat}
            />
          }
          value={displayFiscalValue(postalCode, true)}
        />
        <InfoRow
          className="min-w-0"
          label={comprobanteCopy.subsectionPayment}
          value={displayFiscalValue(paymentSummary)}
        />
      </div>
    </FormSectionCard>
  );
}
