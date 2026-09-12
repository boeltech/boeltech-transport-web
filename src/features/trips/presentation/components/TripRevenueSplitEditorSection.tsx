/**
 * Sección editor del sheet de prorrateo (ADR-0081).
 * El body del sheet sigue siendo dueño de RHF; aquí solo se renderiza UI.
 */
import { Plus, Trash2 } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
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
  RHFMoneyField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import type { TripRevenueSplitFormValues } from "../helpers/tripRevenueSplitDraft";

const splitCopy = tripFiscalCopy.revenueSplit;

export type RevenueSplitClientOption = {
  id: string;
  tradeName?: string | null;
  legalName?: string | null;
};

export interface TripRevenueSplitEditorSectionProps {
  control: Control<TripRevenueSplitFormValues>;
  fields: FieldArrayWithId<TripRevenueSplitFormValues, "legs", "id">[];
  watchedLegs: TripRevenueSplitFormValues["legs"];
  tripClientId: string;
  cpCarrier: string;
  activateOnSave: boolean;
  shareSum: number;
  shareSumComplete: boolean;
  tripClientOptions: RevenueSplitClientOption[];
  clients: RevenueSplitClientOption[];
  hasExistingSplit: boolean;
  showSummary: boolean;
  summaryMessages: string[];
  getValues: UseFormGetValues<TripRevenueSplitFormValues>;
  setValue: UseFormSetValue<TripRevenueSplitFormValues>;
  setSessionDirty: (dirty: boolean) => void;
  onPreset6040: () => void;
  onCancelEditor: () => void;
  onAppendLeg: () => void;
  onRemoveLeg: (index: number) => void;
  clientLabel: (clientId: string) => string;
  confirmCpLabel: string;
  confirmSharesLabel: string;
}

export function TripRevenueSplitEditorSection({
  control,
  fields,
  watchedLegs,
  tripClientId,
  cpCarrier,
  activateOnSave,
  shareSum,
  shareSumComplete,
  tripClientOptions,
  clients,
  hasExistingSplit,
  showSummary,
  summaryMessages,
  getValues,
  setValue,
  setSessionDirty,
  onPreset6040,
  onCancelEditor,
  onAppendLeg,
  onRemoveLeg,
  clientLabel,
  confirmCpLabel,
  confirmSharesLabel,
}: TripRevenueSplitEditorSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onPreset6040}>
          {splitCopy.preset6040}
        </Button>
        {!hasExistingSplit ? (
          <Button type="button" size="sm" variant="ghost" onClick={onCancelEditor}>
            {splitCopy.cancelEditor}
          </Button>
        ) : null}
      </div>

      <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{splitCopy.whoSectionTitle}</p>
          <p className="text-xs text-muted-foreground">
            {splitCopy.whoSectionDescription}
          </p>
        </div>
        <Controller
          control={control}
          name="tripClientId"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="split-trip-client"
              label={splitCopy.tripClientLabel}
              required={activateOnSave}
              description={splitCopy.tripClientHint}
              errorMessage={fieldState.error?.message}
            >
              <Select
                value={field.value || undefined}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSessionDirty(true);
                }}
              >
                <SelectTrigger
                  id="split-trip-client"
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps(
                    "split-trip-client",
                    fieldState.error?.message,
                  )}
                >
                  <SelectValue placeholder={splitCopy.tripClientPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {tripClientOptions.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.tradeName || client.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldShell>
          )}
        />
      </section>

      <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{splitCopy.howSectionTitle}</p>
          <p className="text-xs text-muted-foreground">
            {splitCopy.howSectionDescription}
          </p>
        </div>

        <RHFMoneyField
          control={control}
          name="basisAmount"
          fieldId="split-basis"
          label={splitCopy.basisLabel}
          currencyCode="MXN"
        />

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-md border bg-background/60 p-3 sm:grid-cols-[1fr_120px_auto]"
          >
            <Controller
              control={control}
              name={`legs.${index}.clientId`}
              render={({ field: legField, fieldState }) => (
                <FormFieldShell
                  fieldId={`split-leg-client-${index}`}
                  label={splitCopy.legClientLabel(index)}
                  required
                  errorMessage={fieldState.error?.message}
                >
                  <Select
                    value={legField.value || undefined}
                    onValueChange={(value) => {
                      const previous = legField.value;
                      legField.onChange(value);
                      setSessionDirty(true);
                      const currentTripClient = getValues("tripClientId");
                      if (
                        !currentTripClient ||
                        currentTripClient === previous
                      ) {
                        setValue("tripClientId", value, {
                          shouldDirty: true,
                        });
                      }
                    }}
                  >
                    <SelectTrigger
                      id={`split-leg-client-${index}`}
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        `split-leg-client-${index}`,
                        fieldState.error?.message,
                      )}
                    >
                      <SelectValue
                        placeholder={splitCopy.legClientPlaceholder(index)}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.tradeName || client.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldShell>
              )}
            />
            <Controller
              control={control}
              name={`legs.${index}.sharePercent`}
              render={({ field: shareField, fieldState }) => (
                <FormFieldShell
                  fieldId={`split-leg-share-${index}`}
                  label={splitCopy.shareLabel(index)}
                  required
                  errorMessage={fieldState.error?.message}
                >
                  <Input
                    id={`split-leg-share-${index}`}
                    type="number"
                    min={0.01}
                    max={100}
                    step="0.01"
                    value={
                      Number.isFinite(shareField.value) ? shareField.value : ""
                    }
                    onChange={(event) => {
                      const raw = event.target.value;
                      shareField.onChange(
                        raw === "" ? Number.NaN : Number(raw),
                      );
                      setSessionDirty(true);
                    }}
                    onBlur={shareField.onBlur}
                    error={Boolean(fieldState.error)}
                    aria-label={splitCopy.shareAria(index)}
                    {...getFieldErrorAriaProps(
                      `split-leg-share-${index}`,
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />
            {fields.length > 2 ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="mt-7"
                aria-label={splitCopy.removeLegAria(index)}
                onClick={() => onRemoveLeg(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
          </div>
        ))}

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
            shareSumComplete
              ? "border-success/30 bg-success-soft text-success-soft-foreground"
              : "border-border/80 bg-background/80 text-muted-foreground",
          )}
          aria-live="polite"
        >
          <span className="text-xs">
            {shareSumComplete
              ? splitCopy.shareSumReady
              : splitCopy.shareSumPending}
          </span>
          <span className="font-medium tabular-nums">
            {splitCopy.shareSum(shareSum.toFixed(2))}
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={fields.length >= 10}
          onClick={onAppendLeg}
        >
          <Plus className="mr-1 h-4 w-4" />
          {splitCopy.addLeg}
        </Button>
      </section>

      <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{splitCopy.cpSectionTitle}</p>
          <p className="text-xs text-muted-foreground">
            {splitCopy.cpSectionDescription}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={splitCopy.cpCarrierLabel}
          className="space-y-2"
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="split-cp-carrier"
              className="size-4 accent-primary"
              checked={cpCarrier === "none"}
              onChange={() => {
                setValue("cpCarrier", "none", { shouldDirty: true });
                setSessionDirty(true);
              }}
            />
            {splitCopy.cpNone}
          </label>
          {watchedLegs.map((leg, index) => (
            <label
              key={`cp-${index}`}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="split-cp-carrier"
                className="size-4 accent-primary"
                checked={cpCarrier === String(index)}
                onChange={() => {
                  setValue("cpCarrier", String(index), {
                    shouldDirty: true,
                  });
                  setSessionDirty(true);
                }}
              />
              {splitCopy.cpLeg(
                index,
                leg?.clientId ? clientLabel(leg.clientId) : "",
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-md border border-border/80 bg-muted/20 p-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{splitCopy.saveSectionTitle}</p>
          <p className="text-xs text-muted-foreground">
            {splitCopy.saveSectionDescription}
          </p>
        </div>

        <Controller
          control={control}
          name="activateOnSave"
          render={({ field }) => (
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                  }}
                />
                {splitCopy.activateOnSave}
              </label>
              <p className="pl-6 text-xs text-muted-foreground">
                {splitCopy.activateOnSaveHint}
              </p>
            </div>
          )}
        />

        {activateOnSave ? (
          <div className="space-y-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <p className="font-medium">{splitCopy.confirmTitle}</p>
            <p>
              {splitCopy.confirmTripClient(
                tripClientId ? clientLabel(tripClientId) : "—",
              )}
            </p>
            <p>{confirmCpLabel}</p>
            <p>{splitCopy.confirmShares(confirmSharesLabel)}</p>
          </div>
        ) : null}

        {showSummary && summaryMessages.length > 0 ? (
          <FormValidationSummary
            className="mb-0"
            title={splitCopy.validationSummary}
            messages={summaryMessages}
          />
        ) : null}
      </section>
    </div>
  );
}
