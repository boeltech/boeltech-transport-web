import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import {
  FieldInlineError,
  FormValidationSummary,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { CatalogItem } from "../../domain";
import {
  useCreateCatalogItem,
  useUpdateCatalogItem,
} from "../../application/hooks/useCatalogItemMutations";
import { catalogsCopy } from "../copy/catalogsCopy";
import {
  catalogItemEditFormSchema,
  catalogItemFormSchema,
  type CatalogItemEditFormValues,
  type CatalogItemFormValues,
} from "../validation/catalogItemFormSchema";

interface CatalogItemFormSheetProps {
  typeCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: CatalogItem | null;
  showParentCode?: boolean;
}

export function CatalogItemFormSheet({
  typeCode,
  open,
  onOpenChange,
  item,
  showParentCode = false,
}: CatalogItemFormSheetProps) {
  const isEdit = Boolean(item);
  const copy = catalogsCopy.itemForm;

  const createMutation = useCreateCatalogItem({
    onSuccess: () => onOpenChange(false),
  });
  const updateMutation = useUpdateCatalogItem({
    onSuccess: () => onOpenChange(false),
  });

  const createForm = useForm<CatalogItemFormValues>({
    resolver: zodResolver(
      catalogItemFormSchema,
    ) as Resolver<CatalogItemFormValues>,
    defaultValues: {
      code: "",
      name: "",
      description: "",
      parentCode: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const editForm = useForm<CatalogItemEditFormValues>({
    resolver: zodResolver(
      catalogItemEditFormSchema,
    ) as Resolver<CatalogItemEditFormValues>,
    defaultValues: {
      name: "",
      description: "",
      parentCode: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (item) {
      editForm.reset({
        name: item.name,
        description: item.description ?? "",
        parentCode: item.parentCode ?? "",
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      });
    } else {
      createForm.reset({
        code: "",
        name: "",
        description: "",
        parentCode: "",
        sortOrder: 0,
        isActive: true,
      });
    }
  }, [open, item, createForm, editForm]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleCreate = createForm.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      typeCode,
      data: {
        code: values.code,
        name: values.name,
        description: values.description || null,
        parentCode: values.parentCode || null,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      },
    });
  });

  const handleUpdate = editForm.handleSubmit(async (values) => {
    if (!item) return;
    await updateMutation.mutateAsync({
      typeCode,
      code: item.code,
      data: {
        name: values.name,
        description: values.description || null,
        parentCode: values.parentCode || null,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      },
    });
  });

  const createSummary = collectFieldErrorMessages(createForm.formState.errors);
  const editSummary = collectFieldErrorMessages(editForm.formState.errors);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? copy.editTitle : copy.createTitle}</SheetTitle>
          <SheetDescription>{typeCode}</SheetDescription>
        </SheetHeader>

        {isEdit && item ? (
          <form className="mt-6 flex flex-1 flex-col gap-4" onSubmit={handleUpdate}>
            <div className="space-y-2">
              <Label>{copy.fields.code}</Label>
              <Input value={item.code} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">{copy.fields.name}</Label>
              <Input
                id="edit-name"
                {...editForm.register("name")}
                aria-invalid={Boolean(editForm.formState.errors.name)}
              />
              <FieldInlineError
                fieldId="edit-name"
                message={editForm.formState.errors.name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{copy.fields.description}</Label>
              <Input
                id="edit-description"
                {...editForm.register("description")}
              />
            </div>
            {showParentCode ? (
              <div className="space-y-2">
                <Label htmlFor="edit-parent">{copy.fields.parentCode}</Label>
                <Input id="edit-parent" {...editForm.register("parentCode")} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="edit-sort">{copy.fields.sortOrder}</Label>
              <Input
                id="edit-sort"
                type="number"
                min={0}
                {...editForm.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={editForm.watch("isActive")}
                onCheckedChange={(checked) =>
                  editForm.setValue("isActive", checked === true)
                }
              />
              <Label htmlFor="edit-active">{copy.fields.isActive}</Label>
            </div>
            {editSummary.length > 0 ? (
              <FormValidationSummary
                title={copy.validationSummary}
                messages={editSummary}
              />
            ) : null}
            <div className="mt-auto flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? copy.saving : copy.save}
              </Button>
            </div>
          </form>
        ) : (
          <form className="mt-6 flex flex-1 flex-col gap-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label htmlFor="create-code">{copy.fields.code}</Label>
              <Input
                id="create-code"
                {...createForm.register("code")}
                aria-invalid={Boolean(createForm.formState.errors.code)}
              />
              <p className="text-xs text-muted-foreground">{copy.fields.codeHint}</p>
              <FieldInlineError
                fieldId="create-code"
                message={createForm.formState.errors.code?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">{copy.fields.name}</Label>
              <Input
                id="create-name"
                {...createForm.register("name")}
                aria-invalid={Boolean(createForm.formState.errors.name)}
              />
              <FieldInlineError
                fieldId="create-name"
                message={createForm.formState.errors.name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">{copy.fields.description}</Label>
              <Input id="create-description" {...createForm.register("description")} />
            </div>
            {showParentCode ? (
              <div className="space-y-2">
                <Label htmlFor="create-parent">{copy.fields.parentCode}</Label>
                <Input id="create-parent" {...createForm.register("parentCode")} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="create-sort">{copy.fields.sortOrder}</Label>
              <Input
                id="create-sort"
                type="number"
                min={0}
                {...createForm.register("sortOrder", { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="create-active"
                checked={createForm.watch("isActive")}
                onCheckedChange={(checked) =>
                  createForm.setValue("isActive", checked === true)
                }
              />
              <Label htmlFor="create-active">{copy.fields.isActive}</Label>
            </div>
            {createSummary.length > 0 ? (
              <FormValidationSummary
                title={copy.validationSummary}
                messages={createSummary}
              />
            ) : null}
            <div className="mt-auto flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? copy.saving : copy.save}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
