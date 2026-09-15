import { useEffect, useRef, useState } from "react";

import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription } from "@shared/ui/alert";

import { AlertCircle } from "lucide-react";

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

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@shared/ui/select";

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

  FieldInlineError,

  FormValidationSummary,

  MoneyInput,

  getFieldErrorAriaProps,

  getRegisterFieldErrorProps,

} from "@shared/ui/form";

import { useToast } from "@shared/hooks";

import { getErrorMessage } from "@shared/api/interceptors/error-handler";

import { collectFieldErrorMessages } from "@shared/utils/formErrors";

import { BranchAsyncCombobox } from "@shared/ui/branch-async-combobox/BranchAsyncCombobox";

import {

  useCreateCorridorTariff,

  useUpdateCorridorTariff,

} from "../../application/hooks";

import type { RouteCorridorTariff } from "../../domain/entities";

import { CORRIDOR_REF_TYPE_LABELS, type CorridorRefType } from "../../domain/enums";

import { compensationCopy } from "../copy/compensationCopy";

import {

  corridorTariffFormSchema,

  type CorridorTariffFormData,

  type CorridorTariffFormInput,

} from "../validation/compensationSchemas";

import { findDuplicateCorridorIdsForPayload } from "../utils/corridorMatchKey";

const CORRIDOR_TARIFF_FORM_ID = "corridor-tariff-form";

const copy = compensationCopy.sheet;

const createCorridorDefaultValues: CorridorTariffFormInput = {
  name: "",
  originRefType: "city_label",
  originRefValue: "",
  destinationRefType: "city_label",
  destinationRefValue: "",
  fixedAmount: "",
  notes: "",
  isActive: true,
};



interface CorridorTariffSheetProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  corridor?: RouteCorridorTariff | null;

  existingCorridors?: readonly RouteCorridorTariff[];

  canSave?: boolean;

  onSuccess?: () => void;

}



function corridorRefValueLabel(

  valueName: "originRefValue" | "destinationRefValue",

): string {

  return valueName === "destinationRefValue"

    ? copy.fields.destinationRefValue

    : copy.fields.originRefValue;

}



function CorridorRefValueField({

  control,

  refType,

  valueName,

  valueFieldId,

  errorMessage,

}: {

  control: ReturnType<typeof useForm<CorridorTariffFormInput>>["control"];

  refType: CorridorRefType;

  valueName: "originRefValue" | "destinationRefValue";

  valueFieldId: string;

  errorMessage?: string;

}) {

  if (refType === "branch") {

    return (

      <div className="space-y-1.5">

        <Label htmlFor={valueFieldId}>{corridorRefValueLabel(valueName)}</Label>

        <Controller

          control={control}

          name={valueName}

          render={({ field }) => (

            <BranchAsyncCombobox

              id={valueFieldId}

              value={field.value}

              onChange={field.onChange}

              placeholder={copy.fields.branchPlaceholder}

              error={errorMessage}

            />

          )}

        />

        <FieldInlineError fieldId={valueFieldId} message={errorMessage} />

      </div>

    );

  }



  const placeholder =

    refType === "postal_code"

      ? copy.fields.postalCodePlaceholder

      : copy.fields.cityPlaceholder;



  return (

    <div className="space-y-1.5">

      <Label htmlFor={valueFieldId}>{corridorRefValueLabel(valueName)}</Label>

      <Controller

        control={control}

        name={valueName}

        render={({ field }) => (

          <Input

            id={valueFieldId}

            placeholder={placeholder}

            value={field.value}

            onChange={field.onChange}

            onBlur={field.onBlur}

            name={field.name}

            ref={field.ref}

            error={Boolean(errorMessage)}

            {...getFieldErrorAriaProps(valueFieldId, errorMessage)}

          />

        )}

      />

      <FieldInlineError fieldId={valueFieldId} message={errorMessage} />

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

  const [pendingValues, setPendingValues] = useState<CorridorTariffFormData | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);



  const form = useForm<CorridorTariffFormInput, unknown, CorridorTariffFormData>({

    mode: "onChange",

    resolver: zodResolver(corridorTariffFormSchema) as Resolver<
      CorridorTariffFormInput,
      unknown,
      CorridorTariffFormData
    >,

    defaultValues: createCorridorDefaultValues,

  });



  const {

    control,

    register,

    handleSubmit,

    reset,

    setValue,

    formState: { errors, isSubmitting },

  } = form;



  const originRefType = useWatch({ control, name: "originRefType" });

  const destinationRefType = useWatch({ control, name: "destinationRefType" });

  const validationMessages = collectFieldErrorMessages(errors);

  const previousOriginRefType = useRef<CorridorRefType | null>(null);

  const previousDestinationRefType = useRef<CorridorRefType | null>(null);

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;



  useEffect(() => {

    if (!open) return;

    setApiError(null);

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

      previousOriginRefType.current = corridor.originRefType;

      previousDestinationRefType.current = corridor.destinationRefType;

      return;

    }

    reset({

      name: "",

      originRefType: "city_label",

      originRefValue: "",

      destinationRefType: "city_label",

      destinationRefValue: "",

      notes: "",

      isActive: true,

    });

    previousOriginRefType.current = "city_label";

    previousDestinationRefType.current = "city_label";

  }, [open, corridor, reset]);



  useEffect(() => {

    if (!open) return;

    if (

      previousOriginRefType.current !== null &&

      previousOriginRefType.current !== originRefType

    ) {

      setValue("originRefValue", "", { shouldDirty: true, shouldValidate: true });

    }

    previousOriginRefType.current = originRefType;

  }, [open, originRefType, setValue]);



  useEffect(() => {

    if (!open) return;

    if (

      previousDestinationRefType.current !== null &&

      previousDestinationRefType.current !== destinationRefType

    ) {

      setValue("destinationRefValue", "", { shouldDirty: true, shouldValidate: true });

    }

    previousDestinationRefType.current = destinationRefType;

  }, [open, destinationRefType, setValue]);



  const saveValues = async (values: CorridorTariffFormData) => {

    setApiError(null);

    try {

      if (isEdit && corridor) {

        await updateMutation.mutateAsync({ id: corridor.id, payload: values });

        toast({ title: compensationCopy.toasts.corridorUpdated, variant: "success" });

      } else {

        await createMutation.mutateAsync(values);

        toast({ title: compensationCopy.toasts.corridorCreated, variant: "success" });

      }

      setDuplicateConfirmOpen(false);

      setPendingValues(null);

      onOpenChange(false);

      onSuccess?.();

    } catch (error) {

      setDuplicateConfirmOpen(false);

      setApiError(getErrorMessage(error));

    }

  };



  const onValid = async (values: CorridorTariffFormData) => {

    setApiError(null);

    const duplicateIds = findDuplicateCorridorIdsForPayload(

      existingCorridors,

      values,

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



            <form id={CORRIDOR_TARIFF_FORM_ID} onSubmit={onSubmit} className="space-y-6">

            <div className="space-y-1.5">

              <Label htmlFor="corridor-name">{copy.fields.name}</Label>

              <Input

                id="corridor-name"

                {...register("name")}

                {...getRegisterFieldErrorProps("corridor-name", errors.name?.message)}

              />

              <FieldInlineError fieldId="corridor-name" message={errors.name?.message} />

            </div>



            <section className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">

              <h3 className="text-lg font-semibold">{copy.fields.originSection}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div className="space-y-1.5">

                  <Label htmlFor="origin-ref-type">{copy.fields.matchType}</Label>

                  <Controller

                    control={control}

                    name="originRefType"

                    render={({ field }) => (

                      <Select value={field.value} onValueChange={field.onChange}>

                        <SelectTrigger id="origin-ref-type">

                          <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                          {Object.entries(CORRIDOR_REF_TYPE_LABELS).map(([key, label]) => (

                            <SelectItem key={key} value={key}>

                              {label}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    )}

                  />

                </div>

                <CorridorRefValueField

                  control={control}

                  refType={originRefType}

                  valueName="originRefValue"

                  valueFieldId="origin-ref"

                  errorMessage={errors.originRefValue?.message}

                />

              </div>

            </section>



            <section className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">

              <h3 className="text-lg font-semibold">{copy.fields.destinationSection}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div className="space-y-1.5">

                  <Label htmlFor="destination-ref-type">{copy.fields.matchType}</Label>

                  <Controller

                    control={control}

                    name="destinationRefType"

                    render={({ field }) => (

                      <Select value={field.value} onValueChange={field.onChange}>

                        <SelectTrigger id="destination-ref-type">

                          <SelectValue />

                        </SelectTrigger>

                        <SelectContent>

                          {Object.entries(CORRIDOR_REF_TYPE_LABELS).map(([key, label]) => (

                            <SelectItem key={key} value={key}>

                              {label}

                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    )}

                  />

                </div>

                <CorridorRefValueField

                  control={control}

                  refType={destinationRefType}

                  valueName="destinationRefValue"

                  valueFieldId="destination-ref"

                  errorMessage={errors.destinationRefValue?.message}

                />

              </div>

            </section>



            <div className="space-y-1.5">

              <Label htmlFor="corridor-amount">{copy.fields.fixedAmount}</Label>

              <Controller

                control={control}

                name="fixedAmount"

                render={({ field, fieldState }) => (

                  <MoneyInput

                    id="corridor-amount"

                    name={field.name}

                    value={field.value as number | undefined}

                    onValueChange={field.onChange}

                    onBlur={field.onBlur}

                    error={Boolean(fieldState.error)}

                    {...getFieldErrorAriaProps("corridor-amount", fieldState.error?.message)}

                  />

                )}

              />

              <FieldInlineError fieldId="corridor-amount" message={errors.fixedAmount?.message} />

            </div>



            <div className="space-y-1.5">

              <Label htmlFor="corridor-notes">{copy.fields.notes}</Label>

              <Textarea id="corridor-notes" rows={2} maxLength={2000} {...register("notes")} />

            </div>



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

    </>

  );

}


