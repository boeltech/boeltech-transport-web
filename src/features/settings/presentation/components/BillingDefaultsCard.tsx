/**
 * Valores que se precargan al facturar.
 *
 * Fusiona los antiguos bloques "Valores por defecto" y "Claves SAT por
 * defecto": todos describen lo mismo desde el punto de vista del usuario, un
 * arranque de factura que puede cambiar caso por caso.
 */

import { memo, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { ChevronDown } from "lucide-react";

import { InfoRow } from "@shared/ui/data-display";
import {
  FormFieldShell,
  getFieldErrorAriaProps,
  FieldInlineError,
} from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { cn } from "@shared/lib/utils/cn";

import {
  UsoCfdiSelect,
  FormaPagoSelect,
  MetodoPagoSelect,
  ProductoServicioSearch,
  UnidadMedidaSearch,
  useCatalogItem,
  type CatalogItem,
  type CatalogTypeCodeValue,
} from "@features/catalogs";

import type { BillingSettings } from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  normalizeTasaIva,
  type BillingSettingsFormData,
} from "../validation/billingSettingsSchema";
const copy = billingSettingsCopy.defaults;

const TASA_IVA_OPTIONS = [
  { value: 0.16, label: copy.tasaIvaOptions.general },
  { value: 0.08, label: copy.tasaIvaOptions.border },
  { value: 0, label: copy.tasaIvaOptions.zero },
];

export interface BillingDefaultsCardProps {
  form: UseFormReturn<BillingSettingsFormData>;
  settings: BillingSettings;
  canEdit: boolean;
  /** Operate density: start collapsed (default true). */
  defaultCollapsed?: boolean;
}

export const BillingDefaultsCard = memo(function BillingDefaultsCard({
  form,
  settings,
  canEdit,
  defaultCollapsed = true,
}: BillingDefaultsCardProps) {
  const [open, setOpen] = useState(!defaultCollapsed);

  const body = !canEdit ? (
    <div>
      <CatalogInfoRow
        label={copy.usoCfdi}
        typeCode={"sat_uso_cfdi" as CatalogTypeCodeValue}
        code={settings.defaultUsoCfdi}
      />
      <CatalogInfoRow
        label={copy.formaPago}
        typeCode={"sat_forma_pago" as CatalogTypeCodeValue}
        code={settings.defaultFormaPago}
      />
      <CatalogInfoRow
        label={copy.metodoPago}
        typeCode={"sat_metodo_pago" as CatalogTypeCodeValue}
        code={settings.defaultMetodoPago}
      />
      <CatalogInfoRow
        label={copy.claveProductoServicio}
        typeCode={"sat_clave_prod_serv" as CatalogTypeCodeValue}
        code={settings.claveProductoServicio}
      />
      <CatalogInfoRow
        label={copy.claveUnidad}
        typeCode={"sat_clave_unidad" as CatalogTypeCodeValue}
        code={settings.claveUnidad}
      />
      <InfoRow
        variant="inline"
        label={copy.moneda}
        value={copy.monedaOptions.mxn}
      />
      <InfoRow
        variant="inline"
        label={copy.tasaIva}
        value={
          TASA_IVA_OPTIONS.find(
            (option) => option.value === normalizeTasaIva(settings.tasaIva),
          )?.label ?? copy.emptyValue
        }
      />
    </div>
  ) : (
    <BillingDefaultsFormFields form={form} />
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-4 p-6 text-left"
          >
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{copy.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.description}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
              {open ? copy.collapse : copy.expand}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 border-t px-6 pb-6 pt-4">{body}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

// ============================================================================
// EDICIÓN
// ============================================================================

function BillingDefaultsFormFields({
  form,
}: {
  form: UseFormReturn<BillingSettingsFormData>;
}) {
  const { errors } = form.formState;
  const [
    defaultUsoCfdi,
    defaultFormaPago,
    defaultMetodoPago,
    claveProductoServicio,
    claveUnidad,
    tasaIva,
  ] = useWatch({
    control: form.control,
    name: [
      "defaultUsoCfdi",
      "defaultFormaPago",
      "defaultMetodoPago",
      "claveProductoServicio",
      "claveUnidad",
      "tasaIva",
    ],
  });

  return (
      <div className="grid gap-4 sm:grid-cols-2">
        <FormFieldShell
          fieldId="defaultUsoCfdi"
          label={copy.usoCfdi}
          required
          description={copy.usoCfdiHint}
          errorMessage={errors.defaultUsoCfdi?.message}
        >
          <UsoCfdiSelect
            triggerId="defaultUsoCfdi"
            value={defaultUsoCfdi}
            error={Boolean(errors.defaultUsoCfdi)}
            {...getFieldErrorAriaProps(
              "defaultUsoCfdi",
              errors.defaultUsoCfdi?.message,
            )}
            onValueChange={(value) =>
              form.setValue("defaultUsoCfdi", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </FormFieldShell>

        <FormFieldShell
          fieldId="defaultFormaPago"
          label={copy.formaPago}
          required
          description={copy.formaPagoHint}
          errorMessage={errors.defaultFormaPago?.message}
        >
          <FormaPagoSelect
            triggerId="defaultFormaPago"
            value={defaultFormaPago}
            error={Boolean(errors.defaultFormaPago)}
            {...getFieldErrorAriaProps(
              "defaultFormaPago",
              errors.defaultFormaPago?.message,
            )}
            onValueChange={(value) =>
              form.setValue("defaultFormaPago", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </FormFieldShell>

        <FormFieldShell
          fieldId="defaultMetodoPago"
          label={copy.metodoPago}
          required
          description={copy.metodoPagoHint}
          errorMessage={errors.defaultMetodoPago?.message}
        >
          <MetodoPagoSelect
            triggerId="defaultMetodoPago"
            value={defaultMetodoPago}
            error={Boolean(errors.defaultMetodoPago)}
            {...getFieldErrorAriaProps(
              "defaultMetodoPago",
              errors.defaultMetodoPago?.message,
            )}
            onValueChange={(value) =>
              form.setValue("defaultMetodoPago", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </FormFieldShell>

        <div className="space-y-2">
          <Label htmlFor="moneda">{copy.moneda}</Label>
          <Select value="MXN" disabled>
            <SelectTrigger
              id="moneda"
              error={Boolean(errors.moneda)}
              {...getFieldErrorAriaProps("moneda", errors.moneda?.message)}
            >
              <SelectValue placeholder={copy.monedaPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MXN">{copy.monedaOptions.mxn}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{copy.monedaHint}</p>
          <FieldInlineError fieldId="moneda" message={errors.moneda?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tasaIva">{copy.tasaIva}</Label>
          <Select
            value={String(normalizeTasaIva(tasaIva) ?? 0.16)}
            onValueChange={(value) =>
              form.setValue("tasaIva", Number.parseFloat(value), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id="tasaIva"
              error={Boolean(errors.tasaIva)}
              {...getFieldErrorAriaProps("tasaIva", errors.tasaIva?.message)}
            >
              <SelectValue placeholder={copy.tasaIvaPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {TASA_IVA_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldInlineError fieldId="tasaIva" message={errors.tasaIva?.message} />
        </div>

        <FormFieldShell
          fieldId="claveProductoServicio"
          label={copy.claveProductoServicio}
          required
          description={copy.claveProductoServicioHint}
          errorMessage={errors.claveProductoServicio?.message}
        >
          <ProductoServicioSearch
            id="claveProductoServicio"
            value={claveProductoServicio}
            error={Boolean(errors.claveProductoServicio)}
            aria-invalid={Boolean(errors.claveProductoServicio)}
            aria-describedby={
              errors.claveProductoServicio
                ? "claveProductoServicio-error"
                : undefined
            }
            onSelect={(item: CatalogItem) =>
              form.setValue("claveProductoServicio", item.code, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onClear={() =>
              form.setValue("claveProductoServicio", "", {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </FormFieldShell>

        <FormFieldShell
          fieldId="claveUnidad"
          label={copy.claveUnidad}
          required
          description={copy.claveUnidadHint}
          errorMessage={errors.claveUnidad?.message}
        >
          <UnidadMedidaSearch
            id="claveUnidad"
            value={claveUnidad}
            error={Boolean(errors.claveUnidad)}
            aria-invalid={Boolean(errors.claveUnidad)}
            aria-describedby={
              errors.claveUnidad ? "claveUnidad-error" : undefined
            }
            onSelect={(item: CatalogItem) =>
              form.setValue("claveUnidad", item.code, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onClear={() =>
              form.setValue("claveUnidad", "", {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </FormFieldShell>
      </div>
  );
}

// ============================================================================
// CONSULTA
// ============================================================================

function CatalogInfoRow({
  label,
  typeCode,
  code,
}: {
  label: string;
  typeCode: CatalogTypeCodeValue;
  code: string;
}) {
  const { data } = useCatalogItem(typeCode, code);
  const value = code
    ? data?.name
      ? `${code} — ${data.name}`
      : code
    : copy.emptyValue;

  return <InfoRow variant="inline" label={label} value={value} />;
}
