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
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";

const copy = invoicingCopy;
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

/**
 * Resumen legible de los datos fiscales del receptor.
 * Se edita por excepción en sheet: el prefill del viaje suele ser correcto.
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
          <Pencil className="mr-2 h-4 w-4" aria-hidden />
          {comprobanteCopy.edit}
        </Button>
      }
      contentClassName="pt-0"
    >
      <div className="grid gap-x-8 sm:grid-cols-2">
        <div>
          <InfoRow variant="inline" label={copy.label.taxRegime} value={taxRegimeName} />
          <InfoRow
            variant="inline"
            label={copy.label.postalCode}
            value={postalCode}
            mono
          />
        </div>
        <div>
          <InfoRow variant="inline" label={copy.label.cfdiUsage} value={cfdiUsageName} />
          <InfoRow
            variant="inline"
            label={comprobanteCopy.subsectionPayment}
            value={paymentSummary}
          />
        </div>
      </div>
    </FormSectionCard>
  );
}
