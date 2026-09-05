import { useEffect, useMemo } from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { DateField, FieldInlineError, FormValidationSummary } from "@shared/ui/form";
import { Textarea } from "@shared/ui/text-area/textarea";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { getTodayString } from "@shared/utils/dateUtils";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import {
  useBatchCreateTemplateAssignments,
  useTemplateAssignments,
} from "../../application/hooks";
import { compensationCopy } from "../copy/compensationCopy";
import {
  batchAssignmentFormSchema,
  type BatchAssignmentFormData,
} from "../validation/compensationSchemas";
import { previewBatchAssignmentConflicts } from "../utils/templateAssignmentOverlap";

const copy = compensationCopy.sheet;
const BATCH_FORM_ID = "template-assignment-batch-form";

interface TemplateAssignmentBatchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  initialEmployeeIds?: string[];
  onSuccess?: () => void;
}

export function TemplateAssignmentBatchSheet({
  open,
  onOpenChange,
  templateId,
  initialEmployeeIds,
  onSuccess,
}: TemplateAssignmentBatchSheetProps) {
  const { toast } = useToast();
  const batchMutation = useBatchCreateTemplateAssignments();
  const today = useMemo(() => getTodayString(), []);
  const { data: assignmentsData } = useTemplateAssignments({
    activeOn: today,
    pageSize: 200,
  });
  const allAssignments = assignmentsData?.data ?? [];

  const form = useForm<BatchAssignmentFormData>({
    resolver: zodResolver(batchAssignmentFormSchema) as Resolver<BatchAssignmentFormData>,
    defaultValues: {
      employeeIds: [],
      effectiveFrom: today,
      effectiveTo: "",
      closePreviousAssignment: true,
      reason: "",
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!open) return;
    reset({
      employeeIds: initialEmployeeIds ?? [],
      effectiveFrom: today,
      effectiveTo: "",
      closePreviousAssignment: true,
      reason: "",
    });
  }, [open, initialEmployeeIds, reset, today]);

  const employeeIds = useWatch({ control, name: "employeeIds" }) ?? [];
  const effectiveFrom = useWatch({ control, name: "effectiveFrom" }) ?? today;
  const effectiveTo = useWatch({ control, name: "effectiveTo" });

  const conflictPreview = useMemo(
    () =>
      previewBatchAssignmentConflicts(
        allAssignments,
        employeeIds,
        effectiveFrom,
        effectiveTo?.trim() ? effectiveTo.trim() : null,
      ),
    [allAssignments, employeeIds, effectiveFrom, effectiveTo],
  );

  const validationMessages = collectFieldErrorMessages(errors);

  const employeeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const employeeId of employeeIds) {
      map.set(employeeId, employeeId.slice(0, 8));
    }
    return map;
  }, [employeeIds]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await batchMutation.mutateAsync({
        templateId,
        employeeIds: values.employeeIds,
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo?.trim() ? values.effectiveTo.trim() : null,
        closePreviousAssignment: values.closePreviousAssignment,
        reason: values.reason?.trim() ? values.reason.trim() : null,
      });

      if (result.skippedCount > 0) {
        toast({
          title: compensationCopy.toasts.batchPartial,
          description: `${result.createdCount} asignados, ${result.skippedCount} omitidos.`,
          variant: "default",
        });
      } else {
        toast({ title: compensationCopy.toasts.batchSuccess, variant: "success" });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "No se pudo completar la asignación",
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-background"
        onFocusOutside={(event) => event.preventDefault()}
      >
        <SheetHeader className="px-6 py-4 border-b bg-card shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground">{copy.batchTitle}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {copy.batchDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id={BATCH_FORM_ID} onSubmit={onSubmit} className="space-y-5">
            <Controller
              control={control}
              name="employeeIds"
              render={({ field, fieldState }) => (
                <EmployeeAsyncCombobox
                  mode="multi"
                  id="batch-employees"
                  label={copy.fields.operators}
                  value={field.value}
                  onChange={(ids) => setValue("employeeIds", ids, { shouldValidate: true })}
                  error={fieldState.error?.message}
                />
              )}
            />
            <FieldInlineError fieldId="batch-employees" message={errors.employeeIds?.message} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="batch-from">{copy.fields.effectiveFrom}</Label>
                <Controller
                  control={control}
                  name="effectiveFrom"
                  render={({ field, fieldState }) => (
                    <DateField
                      id="batch-from"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={Boolean(fieldState.error)}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch-to">{copy.fields.effectiveTo}</Label>
                <Controller
                  control={control}
                  name="effectiveTo"
                  render={({ field, fieldState }) => (
                    <DateField
                      id="batch-to"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={Boolean(fieldState.error)}
                    />
                  )}
                />
              </div>
            </div>
            <FieldInlineError fieldId="batch-to" message={errors.effectiveTo?.message} />

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="closePreviousAssignment"
                render={({ field }) => (
                  <Checkbox
                    id="close-previous"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <Label htmlFor="close-previous">{copy.fields.closePrevious}</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-reason">{copy.fields.reason}</Label>
              <Textarea id="batch-reason" rows={2} {...form.register("reason")} />
            </div>

            {conflictPreview.length > 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{copy.conflictPreviewTitle}</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{copy.conflictPreviewDescription}</p>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {conflictPreview.map((conflict) => (
                      <li key={conflict.employeeId}>
                        {employeeLabelById.get(conflict.employeeId) ?? conflict.employeeId.slice(0, 8)}
                        {" — vigencia "}
                        {conflict.assignment.effectiveFrom}
                        {conflict.assignment.effectiveTo
                          ? ` → ${conflict.assignment.effectiveTo}`
                          : " (abierta)"}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

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
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              form={BATCH_FORM_ID}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {copy.confirmBatch}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
