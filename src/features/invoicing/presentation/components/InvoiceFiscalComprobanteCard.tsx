import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Pencil,
} from "lucide-react";
import { useWatch, type Control } from "react-hook-form";
import {
  CatalogTypeCode,
  useCatalogOptions,
  type CatalogTypeCodeValue,
} from "@features/catalogs";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { InfoRow } from "@shared/ui/data-display";
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
  /** Abre el sheet de datos de cobro. */
  onEdit: () => void;
  /** Indicador ✓/⚠ en el encabezado colapsado. */
  receiverReady?: boolean;
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
 * Resumen colapsable de datos de cobro del cliente.
 * SAT visible al expandir o vía sheet «Revisar o corregir».
 */
export function InvoiceFiscalComprobanteCard({
  control,
  onEdit,
  receiverReady = true,
}: InvoiceFiscalComprobanteCardProps) {
  const [open, setOpen] = useState(false);
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

  const StatusIcon = receiverReady ? CheckCircle2 : AlertCircle;
  const statusLabel = receiverReady
    ? comprobanteCopy.collapsedReady
    : comprobanteCopy.collapsedPending;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border bg-card shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-5">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-w-0 flex-1 justify-start gap-2 px-0 py-0 text-left hover:bg-transparent"
          >
            <span className="text-sm font-semibold">{comprobanteCopy.title}</span>
            <StatusIcon
              className={cn(
                "h-4 w-4 shrink-0",
                receiverReady ? "text-success" : "text-warning",
              )}
              aria-hidden
            />
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          {comprobanteCopy.edit}
        </Button>
      </div>

      <CollapsibleContent className="px-4 pb-4 pt-2 sm:px-5">
        <p className="mb-4 text-xs text-muted-foreground">
          {comprobanteCopy.description}
        </p>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
