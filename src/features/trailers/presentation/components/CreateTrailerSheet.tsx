/**
 * CreateTrailerSheet — alta rápida desde asignación de viaje (D6).
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubTipoRemSelect } from "@features/catalogs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { useToast } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useCreateTrailer } from "../../application";
import {
  createTrailerFormSchema,
  type CreateTrailerFormData,
} from "../validation";
import { trailersCopy } from "../copy/trailersCopy";

const copy = trailersCopy.sheet;
const formCopy = trailersCopy.form;

export interface CreateTrailerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Auto-select created trailer in parent wizard. */
  onCreated?: (trailer: { id: string; licensePlate: string }) => void;
}

export function CreateTrailerSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateTrailerSheetProps) {
  const { toast } = useToast();
  const form = useForm<CreateTrailerFormData>({
    resolver: zodResolver(
      createTrailerFormSchema,
    ) as Resolver<CreateTrailerFormData>,
    defaultValues: {
      licensePlate: "",
      satSubTipoRemCode: "",
      notes: "",
      branchId: "",
    },
  });

  const createTrailer = useCreateTrailer({
    onSuccess: (data) => {
      toast({
        title: formCopy.toast.createSuccess,
        description: data.licensePlate,
        variant: "success",
      });
      onCreated?.(data);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: formCopy.toast.errorTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      licensePlate: "",
      satSubTipoRemCode: "",
      notes: "",
      branchId: "",
    });
  }, [open, form]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = form;
  const fieldErrors = collectFieldErrorMessages(errors);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit((data) => {
            createTrailer.mutate({
              licensePlate: data.licensePlate,
              satSubTipoRemCode: data.satSubTipoRemCode,
              notes: data.notes?.trim() || null,
              branchId: data.branchId?.trim() || null,
            });
          })}
          noValidate
        >
          {isSubmitted && fieldErrors.length > 0 ? (
            <FormValidationSummary messages={fieldErrors} />
          ) : null}

          <Controller
            control={control}
            name="licensePlate"
            render={({ field, fieldState }) => (
              <FormFieldShell
                fieldId="sheet-trailer-plate"
                label={formCopy.label.licensePlate}
                required
                errorMessage={fieldState.error?.message}
              >
                <Input
                  id="sheet-trailer-plate"
                  {...field}
                  value={field.value ?? ""}
                  className="uppercase"
                  placeholder={formCopy.placeholder.licensePlate}
                  {...getFieldErrorAriaProps(
                    "sheet-trailer-plate",
                    fieldState.error?.message,
                  )}
                />
              </FormFieldShell>
            )}
          />

          <Controller
            control={control}
            name="satSubTipoRemCode"
            render={({ field, fieldState }) => (
              <FormFieldShell
                fieldId="sheet-trailer-subtipo"
                label={formCopy.label.satSubTipoRemCode}
                required
                errorMessage={fieldState.error?.message}
              >
                <SubTipoRemSelect
                  triggerId="sheet-trailer-subtipo"
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                />
              </FormFieldShell>
            )}
          />

          <p className="text-xs text-muted-foreground">
            <Link
              to="/trailers"
              className="underline underline-offset-2"
              onClick={() => onOpenChange(false)}
            >
              {copy.linkMaster}
            </Link>
          </p>

          <SheetFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTrailer.isPending}
            >
              {copy.cancel}
            </Button>
            <Button type="submit" disabled={createTrailer.isPending}>
              {copy.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
