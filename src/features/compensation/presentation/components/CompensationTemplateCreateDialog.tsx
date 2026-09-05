import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useCreateCompensationTemplate } from "../../application/hooks";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  compensationTemplateCreateFormSchema,
  type CompensationTemplateCreateFormData,
} from "../validation/compensationSchemas";

const copy = compensationCopy.sheet;

interface CompensationTemplateCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (template: CompensationTemplate) => void;
}

export function CompensationTemplateCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: CompensationTemplateCreateDialogProps) {
  const { toast } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  const createMutation = useCreateCompensationTemplate();

  const form = useForm<CompensationTemplateCreateFormData>({
    resolver: zodResolver(
      compensationTemplateCreateFormSchema,
    ) as Resolver<CompensationTemplateCreateFormData>,
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const validationMessages = collectFieldErrorMessages(errors);

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    reset({
      name: "",
      description: "",
      isActive: true,
    });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setApiError(null);
      const created = await createMutation.mutateAsync({
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        isActive: values.isActive,
        rules: [],
        fixedAllowances: [],
        corridorIds: [],
      });
      toast({ title: compensationCopy.toasts.templateCreated, variant: "success" });
      onOpenChange(false);
      onCreated?.(created);
    } catch (error) {
      setApiError(getErrorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.templateCreateTitle}</DialogTitle>
          <DialogDescription>{copy.templateCreateHelp}</DialogDescription>
        </DialogHeader>

        {apiError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="template-create-name">{copy.fields.name}</Label>
            <Input
              id="template-create-name"
              {...register("name")}
              {...getRegisterFieldErrorProps(
                "template-create-name",
                errors.name?.message,
              )}
            />
            <FieldInlineError fieldId="template-create-name" message={errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="template-create-description">{copy.fields.description}</Label>
            <Textarea id="template-create-description" rows={2} {...register("description")} />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  id="template-create-active"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="template-create-active">{copy.fields.templateActive}</Label>
          </div>

          {validationMessages.length > 0 ? (
            <FormValidationSummary
              title={copy.validationSummary}
              messages={validationMessages}
            />
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {copy.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
              {copy.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
