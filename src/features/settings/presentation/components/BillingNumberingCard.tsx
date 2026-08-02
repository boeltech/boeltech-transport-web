/**
 * Numeración de las facturas.
 *
 * Una sola serie: la emisión de facturas usa siempre `serie_factura`, tanto
 * para servicios como para viajes con carta porte. El folio en curso viene
 * calculado por el servidor sobre las facturas emitidas.
 *
 * El primer folio solo es editable mientras la serie no tenga facturas;
 * después queda de solo lectura (el API también lo bloquea con 422).
 */

import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Input } from "@shared/ui/input";
import { InfoRow } from "@shared/ui/data-display";
import { FormFieldShell, getRegisterFieldErrorProps } from "@shared/ui/form";

import type { BillingSettings } from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import type { BillingSettingsFormData } from "../validation/billingSettingsSchema";
import { BILLING_ANCHORS } from "./BillingReadinessCard";
import { SettingsCard } from "./SettingsLayout";

const copy = billingSettingsCopy.numbering;

export interface BillingNumberingCardProps {
  form: UseFormReturn<BillingSettingsFormData>;
  settings: BillingSettings;
  canEdit: boolean;
}

export const BillingNumberingCard = memo(function BillingNumberingCard({
  form,
  settings,
  canEdit,
}: BillingNumberingCardProps) {
  const { errors } = form.formState;
  const canEditFirstFolio = canEdit && !settings.hasIssuedInvoices;

  return (
    <div id={BILLING_ANCHORS.numbering} className="scroll-mt-24">
      <SettingsCard title={copy.title} description={copy.description}>
        <div className="space-y-4">
          {canEdit ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormFieldShell
                fieldId="serieFactura"
                label={copy.serie}
                required
                description={copy.serieHint}
                errorMessage={errors.serieFactura?.message}
              >
                <Input
                  id="serieFactura"
                  placeholder="A"
                  maxLength={5}
                  className="uppercase"
                  {...form.register("serieFactura")}
                  {...getRegisterFieldErrorProps(
                    "serieFactura",
                    errors.serieFactura?.message,
                  )}
                />
              </FormFieldShell>

              {canEditFirstFolio ? (
                <FormFieldShell
                  fieldId="folioInicial"
                  label={copy.firstFolio}
                  required
                  description={copy.firstFolioHint}
                  errorMessage={errors.folioInicial?.message}
                >
                  <Input
                    id="folioInicial"
                    type="number"
                    min={1}
                    placeholder="1"
                    {...form.register("folioInicial", { valueAsNumber: true })}
                    {...getRegisterFieldErrorProps(
                      "folioInicial",
                      errors.folioInicial?.message,
                    )}
                  />
                </FormFieldShell>
              ) : (
                <div>
                  <InfoRow
                    variant="inline"
                    label={copy.firstFolio}
                    value={String(settings.folioInicial)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {copy.firstFolioLockedHint}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <InfoRow
                variant="inline"
                label={copy.serie}
                value={settings.serieFactura}
              />
              <InfoRow
                variant="inline"
                label={copy.firstFolio}
                value={String(settings.folioInicial)}
              />
            </div>
          )}

          <div>
            <InfoRow
              variant="inline"
              label={copy.nextFolioLabel}
              value={
                settings.nextFolio
                  ? copy.nextFolioValue(settings.serieFactura, settings.nextFolio)
                  : copy.nextFolioUnknown
              }
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
});
