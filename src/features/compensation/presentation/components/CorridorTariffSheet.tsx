import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronsUpDown, Loader2, Search } from "lucide-react";

import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  FieldInlineError,
  FormValidationSummary,
  MoneyInput,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useDebounce, useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { cn } from "@shared/lib/utils/cn";

import {
  useCreateCorridorTariff,
  useFrequentCityPairs,
  useUpdateCorridorTariff,
} from "../../application/hooks";
import type {
  CreateCorridorTariffPayload,
  FrequentCityPair,
  RouteCorridorTariff,
} from "../../domain/entities";
import { CORRIDOR_REF_TYPE_LABELS, type CorridorRefType } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";
import {
  corridorTariffCreateFormSchema,
  corridorTariffLegacySoftFormSchema,
  type CorridorTariffFormData,
  type CorridorTariffFormInput,
  type CorridorTariffLegacySoftFormData,
} from "../validation/compensationSchemas";
import { findDuplicateCorridorIdsForPayload } from "../utils/corridorMatchKey";

const CORRIDOR_TARIFF_FORM_ID = "corridor-tariff-form";

const copy = compensationCopy.sheet;

type CorridorSheetFormInput = CorridorTariffFormInput | {
  name: string;
  originRefType: CorridorRefType;
  originRefValue: string;
  destinationRefType: CorridorRefType;
  destinationRefValue: string;
  fixedAmount?: number;
  notes?: string | null;
  isActive: boolean;
};

type CorridorSheetFormOutput = CorridorTariffFormData | CorridorTariffLegacySoftFormData;

const createCorridorDefaultValues: CorridorSheetFormInput = {
  name: "",
  originRefType: "city_label",
  originRefValue: "",
  destinationRefType: "city_label",
  destinationRefValue: "",
  fixedAmount: undefined,
  notes: "",
  isActive: true,
};

interface CorridorTariffSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  corridor?: RouteCorridorTariff | null;
  existingCorridors?: readonly RouteCorridorTariff[];
  canSave?: boolean;
  onSuccess?: (createdId?: string) => void;
}

/** Cualquier ref distinta de city/city (incluye origin-branch operativo). */
function isLegacyCorridorMatch(corridor: RouteCorridorTariff): boolean {
  return (
    corridor.originRefType !== "city_label" ||
    corridor.destinationRefType !== "city_label"
  );
}

function isOriginBranchLegacy(corridor: RouteCorridorTariff): boolean {
  return corridor.originRefType === "branch";
}

function formatFrequentPairLabel(pair: FrequentCityPair): string {
  return `${pair.originCity} → ${pair.destinationCity}`;
}

function formatLegacyRefValue(refType: CorridorRefType, refValue: string): string {
  const trimmed = refValue.trim();
  if (refType === "branch" && trimmed.length > 12) {
    return `${trimmed.slice(0, 8)}…${trimmed.slice(-4)}`;
  }
  return trimmed;
}

function FrequentCityPairsPicker({
  open,
  onApply,
}: {
  open: boolean;
  onApply: (pair: FrequentCityPair) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPair, setSelectedPair] = useState<FrequentCityPair | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const q = debouncedSearch.trim();

  const { data = [], isLoading, isFetching } = useFrequentCityPairs(
    { limit: 20, q: q || undefined },
    { enabled: open && pickerOpen },
  );

  useEffect(() => {
    if (!open) {
      setPickerOpen(false);
      setSearch("");
      setSelectedPair(null);
    }
  }, [open]);

  const showLoading = isLoading || (isFetching && data.length === 0);
  const triggerLabel = selectedPair
    ? formatFrequentPairLabel(selectedPair)
    : copy.frequentBlock.triggerPlaceholder;

  const handleSelect = (pair: FrequentCityPair) => {
    setSelectedPair(pair);
    onApply(pair);
    setPickerOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-1.5">
      <div className="space-y-0.5">
        <Label htmlFor="frequent-city-pair-picker">{copy.frequentBlock.title}</Label>
        <p className="text-xs text-muted-foreground">{copy.frequentBlock.hint}</p>
      </div>

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            id="frequent-city-pair-picker"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={pickerOpen}
            aria-label={copy.frequentBlock.triggerAria}
            className={cn(
              "w-full justify-between font-normal text-left",
              !selectedPair && "text-muted-foreground",
            )}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={copy.frequentBlock.searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {showLoading ? (
                <div
                  className="flex items-center justify-center py-6 text-sm text-muted-foreground"
                  role="status"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.frequentBlock.loading}
                </div>
              ) : data.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {copy.frequentBlock.empty}
                    </p>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {data.map((pair) => {
                    const label = formatFrequentPairLabel(pair);
                    const itemValue = `${pair.originCity}|${pair.destinationCity}|${pair.lastUsedAt}`;
                    return (
                      <CommandItem
                        key={itemValue}
                        value={itemValue}
                        aria-label={copy.frequentBlock.applyAria(
                          pair.originCity,
                          pair.destinationCity,
                        )}
                        onSelect={() => handleSelect(pair)}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 truncate font-medium">{label}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {copy.frequentBlock.tripCount(pair.tripCount)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function LegacyMatchReadonly({ corridor }: { corridor: RouteCorridorTariff }) {
  return (
    <div
      className="rounded-lg border bg-muted/30 px-3 py-3 space-y-2"
      data-testid="legacy-match-definition"
    >
      <p className="text-sm font-medium">{copy.fields.legacyMatchDefinition}</p>
      <dl className="grid gap-2 text-sm">
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <dt className="text-muted-foreground">{copy.fields.legacyOriginLabel}</dt>
          <dd>
            <span className="font-medium">
              {CORRIDOR_REF_TYPE_LABELS[corridor.originRefType]}
            </span>
            <span className="text-muted-foreground">
              {" · "}
              {formatLegacyRefValue(corridor.originRefType, corridor.originRefValue)}
            </span>
          </dd>
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <dt className="text-muted-foreground">{copy.fields.legacyDestinationLabel}</dt>
          <dd>
            <span className="font-medium">
              {CORRIDOR_REF_TYPE_LABELS[corridor.destinationRefType]}
            </span>
            <span className="text-muted-foreground">
              {" · "}
              {formatLegacyRefValue(
                corridor.destinationRefType,
                corridor.destinationRefValue,
              )}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function CorridorTariffSheet({
  open,
  onOpenChange,
  corridor,
  existingCorridors = [],
  canSave = true,
  onSuccess,
}: CorridorTariffSheetProps) {
  const { toast } = useToast();
  const isEdit = Boolean(corridor?.id);
  const canMutate = canSave;
  const createMutation = useCreateCorridorTariff();
  const updateMutation = useUpdateCorridorTariff();
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [convertConfirmOpen, setConvertConfirmOpen] = useState(false);
  const [convertingToCity, setConvertingToCity] = useState(false);
  const [pendingValues, setPendingValues] = useState<CorridorSheetFormOutput | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const isLegacy = isEdit && corridor ? isLegacyCorridorMatch(corridor) : false;
  const usesCitySchema = !isLegacy || convertingToCity;
  const schemaModeRef = useRef<"city" | "legacy_soft">(usesCitySchema ? "city" : "legacy_soft");
  schemaModeRef.current = usesCitySchema ? "city" : "legacy_soft";

  const resolver = useMemo(
    () =>
      (async (values, context, options) => {
        const schema =
          schemaModeRef.current === "city"
            ? corridorTariffCreateFormSchema
            : corridorTariffLegacySoftFormSchema;
        const schemaResolver = zodResolver(schema) as Resolver<
          CorridorSheetFormInput,
          unknown,
          CorridorSheetFormOutput
        >;
        return schemaResolver(values, context, options);
      }) as Resolver<CorridorSheetFormInput, unknown, CorridorSheetFormOutput>,
    [],
  );

  const form = useForm<CorridorSheetFormInput, unknown, CorridorSheetFormOutput>({
    mode: "onChange",
    resolver,
    defaultValues: createCorridorDefaultValues,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting, dirtyFields },
  } = form;

  const validationMessages = collectFieldErrorMessages(errors);
  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const showLegacySoftUi = isLegacy && !convertingToCity;
  const legacyAlertCopy =
    corridor && isOriginBranchLegacy(corridor)
      ? copy.fields.legacyAlertOriginBranch
      : copy.fields.legacyAlertDeadMatch;

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    setConvertingToCity(false);
    setConvertConfirmOpen(false);
    if (corridor) {
      reset({
        name: corridor.name,
        originRefType: corridor.originRefType,
        originRefValue: corridor.originRefValue,
        destinationRefType: corridor.destinationRefType,
        destinationRefValue: corridor.destinationRefValue,
        fixedAmount: corridor.fixedAmount,
        notes: corridor.notes ?? "",
        isActive: corridor.isActive,
      });
      return;
    }
    reset({ ...createCorridorDefaultValues });
  }, [open, corridor, reset]);

  const applyFrequentPair = (pair: FrequentCityPair) => {
    setValue("originRefType", "city_label", { shouldValidate: true });
    setValue("originRefValue", pair.originCity, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("destinationRefType", "city_label", { shouldValidate: true });
    setValue("destinationRefValue", pair.destinationCity, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const currentName = (getValues("name") ?? "").trim();
    if (!currentName || !dirtyFields.name) {
      setValue("name", formatFrequentPairLabel(pair), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const startCityConversion = () => {
    if (!corridor) return;
    const originCity =
      corridor.originRefType === "city_label" ? corridor.originRefValue : "";
    const destinationCity =
      corridor.destinationRefType === "city_label" ? corridor.destinationRefValue : "";

    setConvertingToCity(true);
    setConvertConfirmOpen(false);
    setValue("originRefType", "city_label", { shouldValidate: false });
    setValue("originRefValue", originCity, { shouldDirty: true, shouldValidate: true });
    setValue("destinationRefType", "city_label", { shouldValidate: false });
    setValue("destinationRefValue", destinationCity, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const buildCreateOrCityPayload = (
    values: CorridorSheetFormOutput,
  ): CreateCorridorTariffPayload => ({
    name: values.name,
    originRefType: "city_label",
    originRefValue: values.originRefValue,
    destinationRefType: "city_label",
    destinationRefValue: values.destinationRefValue,
    fixedAmount: values.fixedAmount,
    notes: values.notes ?? null,
    isActive: values.isActive,
  });

  const buildSoftPatchPayload = (
    values: CorridorSheetFormOutput,
  ): Partial<CreateCorridorTariffPayload> => ({
    name: values.name,
    fixedAmount: values.fixedAmount,
    notes: values.notes ?? null,
    isActive: values.isActive,
  });

  const saveValues = async (values: CorridorSheetFormOutput) => {
    setApiError(null);
    try {
      if (isEdit && corridor) {
        const payload =
          isLegacy && !convertingToCity
            ? buildSoftPatchPayload(values)
            : buildCreateOrCityPayload(values);
        await updateMutation.mutateAsync({ id: corridor.id, payload });
        toast({ title: compensationCopy.toasts.corridorUpdated, variant: "success" });
        setDuplicateConfirmOpen(false);
        setPendingValues(null);
        onOpenChange(false);
        onSuccess?.();
      } else {
        const created = await createMutation.mutateAsync(buildCreateOrCityPayload(values));
        toast({ title: compensationCopy.toasts.corridorCreated, variant: "success" });
        setDuplicateConfirmOpen(false);
        setPendingValues(null);
        onOpenChange(false);
        onSuccess?.(created.id);
      }
    } catch (error) {
      setDuplicateConfirmOpen(false);
      setApiError(getErrorMessage(error));
    }
  };

  const onValid = async (values: CorridorSheetFormOutput) => {
    setApiError(null);

    // Soft legacy: refs no cambian → sin chequeo de duplicado por ciudad.
    if (isLegacy && !convertingToCity) {
      await saveValues(values);
      return;
    }

    const cityPayload = buildCreateOrCityPayload(values);
    const duplicateIds = findDuplicateCorridorIdsForPayload(
      existingCorridors,
      cityPayload,
      corridor?.id,
    );

    if (duplicateIds.length > 0) {
      setPendingValues(values);
      setDuplicateConfirmOpen(true);
      return;
    }

    await saveValues(values);
  };

  const onInvalid = async () => {
    await form.trigger(undefined, { shouldFocus: true });
  };

  const onSubmit = handleSubmit(onValid, onInvalid);

  const handleDuplicateConfirm = async () => {
    if (!pendingValues) return;
    await saveValues(pendingValues);
  };

  const showCityFields = !isEdit || !isLegacy || convertingToCity;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background"
          onFocusOutside={(event) => event.preventDefault()}
        >
          <SheetHeader className="px-6 py-4 border-b bg-card shrink-0">
            <SheetTitle className="text-lg font-semibold text-foreground">
              {isEdit ? copy.corridorEditTitle : copy.corridorCreateTitle}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {copy.corridorHelp}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {apiError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            ) : null}

            {!canMutate ? (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{copy.saveForbidden}</AlertDescription>
              </Alert>
            ) : null}

            {showLegacySoftUi && corridor ? (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{legacyAlertCopy}</AlertDescription>
              </Alert>
            ) : null}

            <form id={CORRIDOR_TARIFF_FORM_ID} onSubmit={onSubmit} className="space-y-6">
              {showLegacySoftUi && corridor ? (
                <div className="space-y-3">
                  <LegacyMatchReadonly corridor={corridor} />
                  {canMutate ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConvertConfirmOpen(true)}
                    >
                      {copy.fields.convertToCity}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {showCityFields ? (
                <section className="space-y-4" aria-labelledby="trayecto-heading">
                  <h3 id="trayecto-heading" className="text-sm font-semibold">
                    {copy.trayectoSection}
                  </h3>

                  {!isEdit ? (
                    <FrequentCityPairsPicker open={open} onApply={applyFrequentPair} />
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="origin-ref">{copy.fields.originCity}</Label>
                    <Input
                      id="origin-ref"
                      placeholder={copy.fields.cityPlaceholder}
                      {...register("originRefValue")}
                      {...getRegisterFieldErrorProps(
                        "origin-ref",
                        errors.originRefValue?.message,
                      )}
                    />
                    <FieldInlineError
                      fieldId="origin-ref"
                      message={errors.originRefValue?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="destination-ref">{copy.fields.destinationCity}</Label>
                    <Input
                      id="destination-ref"
                      placeholder={copy.fields.cityPlaceholder}
                      {...register("destinationRefValue")}
                      {...getRegisterFieldErrorProps(
                        "destination-ref",
                        errors.destinationRefValue?.message,
                      )}
                    />
                    <FieldInlineError
                      fieldId="destination-ref"
                      message={errors.destinationRefValue?.message}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">{copy.fields.cityMatchHint}</p>
                </section>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="corridor-name">{copy.fields.name}</Label>
                <Input
                  id="corridor-name"
                  {...register("name")}
                  {...getRegisterFieldErrorProps("corridor-name", errors.name?.message)}
                />
                <FieldInlineError fieldId="corridor-name" message={errors.name?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="corridor-amount">{copy.fields.fixedAmount}</Label>
                <Controller
                  control={control}
                  name="fixedAmount"
                  render={({ field, fieldState }) => (
                    <MoneyInput
                      id="corridor-amount"
                      name={field.name}
                      value={typeof field.value === "number" ? field.value : undefined}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        "corridor-amount",
                        fieldState.error?.message,
                      )}
                    />
                  )}
                />
                <FieldInlineError
                  fieldId="corridor-amount"
                  message={errors.fixedAmount?.message}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="corridor-notes">{copy.fields.notes}</Label>
                <Textarea
                  id="corridor-notes"
                  rows={2}
                  maxLength={2000}
                  {...register("notes")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <Checkbox
                        id="corridor-active"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                  <Label htmlFor="corridor-active">{copy.fields.corridorActive}</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {copy.fields.corridorActiveHint}
                </p>
              </div>

              {validationMessages.length > 0 ? (
                <FormValidationSummary
                  title={copy.validationSummary}
                  messages={validationMessages}
                />
              ) : null}
            </form>
          </div>

          <SheetFooter className="p-4 border-t bg-card shrink-0">
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => onOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button
                type="submit"
                form={CORRIDOR_TARIFF_FORM_ID}
                disabled={isSaving || !canMutate}
                isLoading={isSaving}
              >
                {isSaving ? copy.savePending : copy.save}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={duplicateConfirmOpen} onOpenChange={setDuplicateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.duplicateConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.duplicateConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingValues(null);
              }}
            >
              {copy.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving || !canMutate}
              onClick={(event) => {
                event.preventDefault();
                void handleDuplicateConfirm();
              }}
            >
              {isSaving ? copy.savePending : copy.duplicateConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={convertConfirmOpen} onOpenChange={setConvertConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.fields.convertToCityConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.fields.convertToCityConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                startCityConversion();
              }}
            >
              {copy.fields.convertToCityConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
