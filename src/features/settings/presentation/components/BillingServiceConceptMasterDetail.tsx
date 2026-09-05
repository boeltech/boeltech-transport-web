/**
 * Master-detail para el catálogo de servicios de cobro (facturación).
 */

import { useMemo, useState } from "react";
import { Loader2, Package, Plus } from "lucide-react";
import { Button } from "@shared/ui/button";
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
import { AlertWithIcon } from "@shared/ui/alert";
import { Checkbox } from "@shared/ui/checkbox";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormFieldShell } from "@shared/ui/form";
import { MoneyInput } from "@shared/ui/form/MoneyInput";
import { Input } from "@shared/ui/input";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { ProductoServicioSearch, UnidadMedidaSearch } from "@features/catalogs";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { usePermissions } from "@shared/permissions";
import {
  useBillingServiceConcepts,
  useCreateBillingServiceConcept,
  useDeleteBillingServiceConcept,
  useUpdateBillingServiceConcept,
} from "../../application/hooks/useBillingServiceConcepts";
import type { BillingServiceConcept } from "../../domain/billingServiceConcept.types";
import { billingServiceConceptsCopy } from "../copy/billingServiceConceptsCopy";

const copy = billingServiceConceptsCopy;

type FormState = {
  name: string;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  defaultUnitPrice?: number;
  ivaAplica: boolean;
  retencionAplica: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm = (): FormState => ({
  name: "",
  claveProdServ: "78121603",
  claveUnidad: "E48",
  unidad: "Servicio",
  defaultUnitPrice: undefined,
  ivaAplica: true,
  retencionAplica: false,
});

function sortServices(list: BillingServiceConcept[]): BillingServiceConcept[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function serviceToForm(service: BillingServiceConcept): FormState {
  return {
    name: service.name,
    claveProdServ: service.claveProdServ,
    claveUnidad: service.claveUnidad,
    unidad: service.unidad,
    defaultUnitPrice: service.defaultUnitPrice ?? undefined,
    ivaAplica: service.ivaAplica,
    retencionAplica: service.retencionAplica,
  };
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) {
    errors.name = copy.form.validation.nameRequired;
  }
  if (!form.claveProdServ.trim()) {
    errors.claveProdServ = copy.form.validation.claveProdServRequired;
  }
  if (!form.claveUnidad.trim()) {
    errors.claveUnidad = copy.form.validation.claveUnidadRequired;
  }
  if (!form.unidad.trim()) {
    errors.unidad = copy.form.validation.unidadRequired;
  }
  return errors;
}

interface ServiceListRowProps {
  service: BillingServiceConcept;
  selected: boolean;
  onClick: () => void;
}

function ServiceListRow({ service, selected, onClick }: ServiceListRowProps) {
  const meta = [
    service.claveProdServ,
    service.unidad,
    service.defaultUnitPrice != null
      ? formatMxCurrency(service.defaultUnitPrice)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{service.name}</div>
        {!service.isActive ? (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {copy.list.inactiveBadge}
          </span>
        ) : null}
      </div>
      <div className="text-xs text-muted-foreground">{meta}</div>
    </button>
  );
}

interface BillingServiceConceptFormPanelProps {
  initial: FormState;
  isCreating: boolean;
  editingId: string | null;
  isPending: boolean;
  canWrite: boolean;
  isInactive: boolean;
  onCancel: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onSave: (form: FormState) => Promise<void>;
}

function BillingServiceConceptFormPanel({
  initial,
  isCreating,
  editingId,
  isPending,
  canWrite,
  isInactive,
  onCancel,
  onDeactivate,
  onReactivate,
  onSave,
}: BillingServiceConceptFormPanelProps) {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const readOnly = !canWrite;

  const formTitle = isCreating
    ? copy.form.createTitle
    : readOnly
      ? copy.form.viewTitle
      : copy.form.editTitle;

  const handleSave = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    await onSave(form);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">{formTitle}</h3>

      <FormFieldShell
        fieldId="billing-service-name"
        label={copy.form.name}
        required
        description={copy.form.nameHint}
        errorMessage={fieldErrors.name}
      >
        <Input
          id="billing-service-name"
          value={form.name}
          disabled={isPending || readOnly}
          aria-invalid={Boolean(fieldErrors.name)}
          onChange={(event) => {
            setForm((prev) => ({ ...prev, name: event.target.value }));
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
        />
      </FormFieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormFieldShell
          fieldId="billing-service-clave-prod"
          label={copy.form.claveProdServ}
          required
          description={copy.form.claveProdServHint}
          errorMessage={fieldErrors.claveProdServ}
        >
          <ProductoServicioSearch
            value={form.claveProdServ}
            disabled={isPending || readOnly}
            onSelect={(item) => {
              setForm((prev) => ({ ...prev, claveProdServ: item.code }));
              if (fieldErrors.claveProdServ) {
                setFieldErrors((prev) => ({ ...prev, claveProdServ: undefined }));
              }
            }}
            onClear={() => setForm((prev) => ({ ...prev, claveProdServ: "" }))}
          />
        </FormFieldShell>

        <FormFieldShell
          fieldId="billing-service-clave-unidad"
          label={copy.form.claveUnidad}
          required
          description={copy.form.claveUnidadHint}
          errorMessage={fieldErrors.claveUnidad}
        >
          <UnidadMedidaSearch
            value={form.claveUnidad}
            disabled={isPending || readOnly}
            onSelect={(item) => {
              setForm((prev) => ({
                ...prev,
                claveUnidad: item.code,
                unidad: item.name || prev.unidad,
              }));
              if (fieldErrors.claveUnidad) {
                setFieldErrors((prev) => ({ ...prev, claveUnidad: undefined }));
              }
            }}
            onClear={() => setForm((prev) => ({ ...prev, claveUnidad: "" }))}
          />
        </FormFieldShell>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormFieldShell
          fieldId="billing-service-unidad"
          label={copy.form.unidad}
          required
          description={copy.form.unidadHint}
          errorMessage={fieldErrors.unidad}
        >
          <Input
            id="billing-service-unidad"
            value={form.unidad}
            disabled={isPending || readOnly}
            aria-invalid={Boolean(fieldErrors.unidad)}
            onChange={(event) => {
              setForm((prev) => ({ ...prev, unidad: event.target.value }));
              if (fieldErrors.unidad) {
                setFieldErrors((prev) => ({ ...prev, unidad: undefined }));
              }
            }}
          />
        </FormFieldShell>

        <FormFieldShell
          fieldId="billing-service-price"
          label={copy.form.defaultUnitPrice}
          description={copy.form.defaultUnitPriceHint}
        >
          <MoneyInput
            id="billing-service-price"
            value={form.defaultUnitPrice}
            disabled={isPending || readOnly}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, defaultUnitPrice: value }))
            }
          />
        </FormFieldShell>
      </div>

      <div className="space-y-3 rounded-md border bg-muted/20 p-4">
        <div>
          <p className="text-sm font-medium">{copy.form.taxesHeading}</p>
          <p className="text-xs text-muted-foreground">{copy.form.taxesHint}</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.ivaAplica}
              disabled={isPending || readOnly}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, ivaAplica: Boolean(checked) }))
              }
            />
            {copy.form.ivaAplica}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.retencionAplica}
              disabled={isPending || readOnly}
              onCheckedChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  retencionAplica: Boolean(checked),
                }))
              }
            />
            {copy.form.retencionAplica}
          </label>
        </div>
      </div>

      {canWrite ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {copy.form.cancel}
          </Button>
          {editingId && !isCreating && isInactive ? (
            <Button
              type="button"
              variant="outline"
              onClick={onReactivate}
              disabled={isPending}
            >
              {copy.form.reactivate}
            </Button>
          ) : null}
          {editingId && !isCreating && !isInactive ? (
            <Button
              type="button"
              variant="outline"
              onClick={onDeactivate}
              disabled={isPending}
            >
              {copy.form.deactivate}
            </Button>
          ) : null}
          {!isInactive || isCreating ? (
            <Button type="button" onClick={() => void handleSave()} disabled={isPending}>
              {copy.form.save}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BillingServiceConceptMasterDetail() {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission("billing_service_concepts", "create");
  const [showInactive, setShowInactive] = useState(false);

  const listParams = showInactive ? undefined : { isActive: true as const };
  const {
    data: services = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useBillingServiceConcepts(listParams);
  const createMutation = useCreateBillingServiceConcept();
  const updateMutation = useUpdateBillingServiceConcept();
  const deleteMutation = useDeleteBillingServiceConcept();

  const sorted = useMemo(() => sortServices(services), [services]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BillingServiceConcept | null>(
    null,
  );

  const isForbidden = isError && isApiError(error) && error.status === 403;
  const isEmpty = !isError && sorted.length === 0;
  const showCreateForm = canWrite && (isCreating || isEmpty);

  const displaySelectedId = showCreateForm
    ? null
    : selectedId && sorted.some((service) => service.id === selectedId)
      ? selectedId
      : sorted[0]?.id ?? null;

  const selected =
    displaySelectedId != null
      ? sorted.find((service) => service.id === displaySelectedId) ?? null
      : null;

  const formInitial = showCreateForm
    ? emptyForm()
    : selected
      ? serviceToForm(selected)
      : emptyForm();

  const formPanelKey = showCreateForm
    ? "create"
    : displaySelectedId ?? "none";

  const handleCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
  };

  const handleSelect = (service: BillingServiceConcept) => {
    setSelectedId(service.id);
    setIsCreating(false);
  };

  const handleCancel = () => {
    if (showCreateForm && !isEmpty) {
      setSelectedId(sorted[0]!.id);
      setIsCreating(false);
      return;
    }
    setIsCreating(isEmpty && canWrite);
    setSelectedId(null);
  };

  const handleSave = async (form: FormState) => {
    const payload = {
      name: form.name.trim(),
      claveProdServ: form.claveProdServ,
      claveUnidad: form.claveUnidad,
      unidad: form.unidad.trim(),
      defaultUnitPrice: form.defaultUnitPrice,
      objectImp: "02" as const,
      ivaAplica: form.ivaAplica,
      retencionAplica: form.retencionAplica,
    };

    if (displaySelectedId && !showCreateForm) {
      await updateMutation.mutateAsync({ id: displaySelectedId, payload });
      return;
    }

    const created = await createMutation.mutateAsync(payload);
    setSelectedId(created.id);
    setIsCreating(false);
  };

  const handleReactivate = async () => {
    if (!selected) return;
    await updateMutation.mutateAsync({
      id: selected.id,
      payload: { isActive: true },
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
    if (selectedId === pendingDelete.id) {
      setSelectedId(null);
      setIsCreating(sorted.length <= 1 && canWrite);
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  if (isError) {
    return (
      <div className="space-y-4">
        <AlertWithIcon
          variant="destructive"
          title={isForbidden ? copy.list.forbiddenTitle : copy.list.errorTitle}
        >
          <div className="space-y-3">
            <p>
              {isForbidden
                ? copy.list.forbiddenDescription
                : copy.list.errorDescription}
            </p>
            {!isForbidden ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void refetch()}
              >
                {copy.list.retry}
              </Button>
            ) : null}
          </div>
        </AlertWithIcon>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertWithIcon variant="info" title={copy.info.title}>
        {copy.info.description}
      </AlertWithIcon>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {copy.list.title} ({sorted.length})
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={showInactive}
              onCheckedChange={(checked) => setShowInactive(Boolean(checked))}
            />
            {copy.list.showInactive}
          </label>
          {canWrite ? (
            <Button type="button" size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {copy.list.add}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <div className="space-y-2 rounded-lg border bg-muted/20 p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              {copy.list.loading}
            </div>
          ) : isEmpty ? (
            <EmptyState
              icon={<Package className="h-10 w-10 text-muted-foreground" />}
              title={copy.list.emptyTitle}
              description={
                canWrite
                  ? copy.list.emptyDescription
                  : copy.list.emptyReadOnlyDescription
              }
              cta={
                canWrite
                  ? {
                      label: copy.list.add,
                      onClick: handleCreate,
                    }
                  : undefined
              }
            />
          ) : (
            sorted.map((service) => (
              <ServiceListRow
                key={service.id}
                service={service}
                selected={service.id === displaySelectedId && !showCreateForm}
                onClick={() => handleSelect(service)}
              />
            ))
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          {!isLoading && (showCreateForm || selected) ? (
            <BillingServiceConceptFormPanel
              key={formPanelKey}
              initial={formInitial}
              isCreating={showCreateForm}
              editingId={displaySelectedId}
              isPending={isPending}
              canWrite={canWrite}
              isInactive={selected != null && !selected.isActive}
              onCancel={handleCancel}
              onDeactivate={() => selected && setPendingDelete(selected)}
              onReactivate={() => void handleReactivate()}
              onSave={handleSave}
            />
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.delete.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.delete.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.delete.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.delete.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
