/**
 * Valores que se precargan al facturar.
 *
 * Fusiona los antiguos bloques "Valores por defecto" y "Claves SAT por
 * defecto": todos describen lo mismo desde el punto de vista del usuario, un
 * arranque de factura que puede cambiar caso por caso.
 */

import { memo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { InfoRow } from "@shared/ui/data-display";
import {
  FormFieldShell,
  getFieldErrorAriaProps,
  FieldInlineError,
} from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import {
  UsoCfdiSelect,
  FormaPagoSelect,
  MetodoPagoSelect,
  ProductoServicioCPSearch,
  UnidadMedidaSearch,
  useCatalogItem,
  type CatalogItem,
  type CatalogTypeCodeValue,
} from "@features/catalogs";

import type { BillingSettings } from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  normalizeMoneda,
  normalizeTasaIva,
  type AllowedMoneda,
  type BillingSettingsFormData,
} from "../validation/billingSettingsSchema";
import { SettingsCard } from "./SettingsLayout";

const copy = billingSettingsCopy.defaults;

const MONEDA_OPTIONS: { value: AllowedMoneda; label: string }[] = [
  { value: "MXN", label: copy.monedaOptions.mxn },
  { value: "USD", label: copy.monedaOptions.usd },
];

const TASA_IVA_OPTIONS = [
  { value: 0.16, label: copy.tasaIvaOptions.general },
  { value: 0.08, label: copy.tasaIvaOptions.border },
  { value: 0, label: copy.tasaIvaOptions.zero },
];

export interface BillingDefaultsCardProps {
  form: UseFormReturn<BillingSettingsFormData>;
  settings: BillingSettings;
  canEdit: boolean;
}

export const BillingDefaultsCard = memo(function BillingDefaultsCard({
  form,
  settings,
  canEdit,
}: BillingDefaultsCardProps) {
  if (!canEdit) {
    return (
      <SettingsCard title={copy.title} description={copy.description}>
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
            typeCode={"sat_clave_prod_serv_cp" as CatalogTypeCodeValue}
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
            value={
              MONEDA_OPTIONS.find(
                (option) => option.value === normalizeMoneda(settings.moneda),
              )?.label ?? copy.emptyValue
            }
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
      </SettingsCard>
    );
  }

  return <BillingDefaultsForm form={form} />;
});

// ============================================================================
// EDICIÓN
// ============================================================================

function BillingDefaultsForm({
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
    moneda,
    tasaIva,
  ] = useWatch({
    control: form.control,
    name: [
      "defaultUsoCfdi",
      "defaultFormaPago",
      "defaultMetodoPago",
      "claveProductoServicio",
      "claveUnidad",
      "moneda",
      "tasaIva",
    ],
  });

  return (
    <SettingsCard title={copy.title} description={copy.description}>
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
          <Select
            value={normalizeMoneda(moneda) ?? "MXN"}
            onValueChange={(value) =>
              form.setValue("moneda", value.toUpperCase() as AllowedMoneda, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id="moneda"
              error={Boolean(errors.moneda)}
              {...getFieldErrorAriaProps("moneda", errors.moneda?.message)}
            >
              <SelectValue placeholder={copy.monedaPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {MONEDA_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <ProductoServicioCPSearch
            value={claveProductoServicio}
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
            value={claveUnidad}
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
    </SettingsCard>
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
