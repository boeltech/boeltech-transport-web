/**
 * Catálogo de esquemas de facturación (ADR-0082).
 * Master-detail Settings — peer: BillingServiceConceptMasterDetail.
 */

import { useMemo, useState } from "react";
import { CalendarClock, Loader2, Plus } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
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
import { Checkbox } from "@shared/ui/checkbox";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormFieldShell } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { cn } from "@shared/lib/utils/cn";
import { usePermissions } from "@shared/permissions";
import {
  BILLING_CADENCE_KINDS,
  type BillingCadenceKind,
  type BillingScheme,
} from "../../domain/billingScheme.types";
import {
  useBillingSchemes,
  useCreateBillingScheme,
  useDeleteBillingScheme,
  useUpdateBillingScheme,
} from "../../application/hooks/useBillingSchemes";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";
import { formatBillingSchemeCadenceSummary } from "../utils/formatBillingSchemeCadence";

const copy = billingSchemesCopy;

type FormState = {
  name: string;
  cadenceKind: BillingCadenceKind;
  windowHours: string;
  weekdays: number[];
  monthDays: string;
  monthlyMode: "days" | "business";
  businessDays: string;
  isDefault: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm = (): FormState => ({
  name: "",
  cadenceKind: "event",
  windowHours: "48",
  weekdays: [4, 5],
  monthDays: "10, 20, 30",
  monthlyMode: "days",
  businessDays: "3",
  isDefault: false,
});

function sortSchemes(list: BillingScheme[]): BillingScheme[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function parseMonthDays(raw: string): number[] {
  return [
    ...new Set(
      raw
        .split(/[,;\s]+/)
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 31),
    ),
  ].sort((a, b) => a - b);
}

function schemeToForm(scheme: BillingScheme): FormState {
  const base = emptyForm();
  base.name = scheme.name;
  base.cadenceKind = scheme.cadenceKind;
  base.isDefault = scheme.isDefault;

  const params = scheme.params;
  if ("windowHours" in params) {
    base.windowHours = String(params.windowHours);
  } else if ("weekdays" in params) {
    base.weekdays = [...params.weekdays];
  } else if ("monthDays" in params) {
    base.monthDays = params.monthDays.join(", ");
    base.monthlyMode = "days";
  } else if ("businessDaysFromMonthStart" in params) {
    base.businessDays = String(params.businessDaysFromMonthStart);
    base.monthlyMode = "business";
  }
  return base;
}

function buildParams(form: FormState): Record<string, unknown> {
  switch (form.cadenceKind) {
    case "event":
      return { windowHours: Number(form.windowHours) };
    case "periodic_weekly":
      return { weekdays: [...form.weekdays].sort((a, b) => a - b) };
    case "periodic_decadal":
      return { monthDays: parseMonthDays(form.monthDays) };
    case "periodic_monthly":
      if (form.monthlyMode === "business") {
        return { businessDaysFromMonthStart: Number(form.businessDays) };
      }
      return { monthDays: parseMonthDays(form.monthDays) };
    default:
      return { windowHours: 48 };
  }
}

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = copy.form.validation.nameRequired;

  switch (form.cadenceKind) {
    case "event": {
      const h = Number(form.windowHours);
      if (!Number.isFinite(h) || h <= 0) {
        errors.windowHours = copy.form.validation.windowHoursRequired;
      }
      break;
    }
    case "periodic_weekly":
      if (form.weekdays.length === 0) {
        errors.weekdays = copy.form.validation.weekdaysRequired;
      }
      break;
    case "periodic_decadal":
      if (parseMonthDays(form.monthDays).length === 0) {
        errors.monthDays = copy.form.validation.monthDaysRequired;
      }
      break;
    case "periodic_monthly":
      if (form.monthlyMode === "business") {
        const n = Number(form.businessDays);
        if (!Number.isInteger(n) || n < 1 || n > 15) {
          errors.businessDays = copy.form.validation.businessDaysRequired;
        }
      } else if (parseMonthDays(form.monthDays).length === 0) {
        errors.monthDays = copy.form.validation.monthDaysRequired;
      }
      break;
  }
  return errors;
}

interface SchemeListRowProps {
  scheme: BillingScheme;
  selected: boolean;
  onClick: () => void;
}

function SchemeListRow({ scheme, selected, onClick }: SchemeListRowProps) {
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{scheme.name}</span>
        {scheme.isDefault ? (
          <Badge variant="secondary" className="text-xs">
            {copy.list.defaultBadge}
          </Badge>
        ) : null}
        {!scheme.isActive ? (
          <Badge variant="outline" className="text-xs">
            {copy.list.inactiveBadge}
          </Badge>
        ) : null}
      </div>
      <div className="text-xs text-muted-foreground">
        {formatBillingSchemeCadenceSummary(scheme)}
      </div>
    </button>
  );
}

interface BillingSchemeFormPanelProps {
  initial: FormState;
  isCreating: boolean;
  isPending: boolean;
  canMutate: boolean;
  onCancel: () => void;
  onDeactivate: () => void;
  onSave: (form: FormState) => Promise<void>;
}

function BillingSchemeFormPanel({
  initial,
  isCreating,
  isPending,
  canMutate,
  onCancel,
  onDeactivate,
  onSave,
}: BillingSchemeFormPanelProps) {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSave = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    await onSave(form);
  };

  const toggleWeekday = (day: number) => {
    setForm((prev) => {
      const has = prev.weekdays.includes(day);
      return {
        ...prev,
        weekdays: has
          ? prev.weekdays.filter((d) => d !== day)
          : [...prev.weekdays, day],
      };
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">
        {isCreating ? copy.form.createTitle : copy.form.editTitle}
      </h3>

      <FormFieldShell
        fieldId="billing-scheme-name"
        label={copy.form.name}
        required
        description={copy.form.nameHint}
        errorMessage={fieldErrors.name}
      >
        <Input
          id="billing-scheme-name"
          value={form.name}
          disabled={isPending || !canMutate}
          aria-invalid={Boolean(fieldErrors.name)}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, name: e.target.value }));
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
        />
      </FormFieldShell>

      <FormFieldShell
        fieldId="billing-scheme-cadence"
        label={copy.form.cadence}
        description={copy.form.cadenceHint}
      >
        <Select
          value={form.cadenceKind}
          disabled={isPending || !canMutate}
          onValueChange={(value) =>
            setForm((prev) => ({
              ...prev,
              cadenceKind: value as BillingCadenceKind,
            }))
          }
        >
          <SelectTrigger id="billing-scheme-cadence">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BILLING_CADENCE_KINDS.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {copy.cadence[kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormFieldShell>

      {form.cadenceKind === "event" ? (
        <FormFieldShell
          fieldId="billing-scheme-window-hours"
          label={copy.form.params.windowHours}
          description={copy.form.params.windowHoursHint}
          errorMessage={fieldErrors.windowHours}
        >
          <Input
            id="billing-scheme-window-hours"
            type="number"
            min={1}
            value={form.windowHours}
            disabled={isPending || !canMutate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, windowHours: e.target.value }))
            }
          />
        </FormFieldShell>
      ) : null}

      {form.cadenceKind === "periodic_weekly" ? (
        <FormFieldShell
          fieldId="billing-scheme-weekdays"
          label={copy.form.params.weekdays}
          errorMessage={fieldErrors.weekdays}
        >
          <div className="flex flex-wrap gap-3">
            {copy.weekdays.map((label, index) => (
              <label key={label} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.weekdays.includes(index)}
                  disabled={isPending || !canMutate}
                  onCheckedChange={() => toggleWeekday(index)}
                />
                {label}
              </label>
            ))}
          </div>
        </FormFieldShell>
      ) : null}

      {form.cadenceKind === "periodic_decadal" ? (
        <FormFieldShell
          fieldId="billing-scheme-month-days"
          label={copy.form.params.monthDays}
          description={copy.form.params.monthDaysHint}
          errorMessage={fieldErrors.monthDays}
        >
          <Input
            id="billing-scheme-month-days"
            value={form.monthDays}
            disabled={isPending || !canMutate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, monthDays: e.target.value }))
            }
          />
        </FormFieldShell>
      ) : null}

      {form.cadenceKind === "periodic_monthly" ? (
        <div className="space-y-3">
          <FormFieldShell
            fieldId="billing-scheme-monthly-mode"
            label={copy.form.params.monthlyMode}
          >
            <Select
              value={form.monthlyMode}
              disabled={isPending || !canMutate}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  monthlyMode: value as "days" | "business",
                }))
              }
            >
              <SelectTrigger id="billing-scheme-monthly-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">
                  {copy.form.params.monthlyByDays}
                </SelectItem>
                <SelectItem value="business">
                  {copy.form.params.monthlyByBusiness}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormFieldShell>
          {form.monthlyMode === "days" ? (
            <FormFieldShell
              fieldId="billing-scheme-month-days-m"
              label={copy.form.params.monthDays}
              description={copy.form.params.monthDaysHint}
              errorMessage={fieldErrors.monthDays}
            >
              <Input
                id="billing-scheme-month-days-m"
                value={form.monthDays}
                disabled={isPending || !canMutate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, monthDays: e.target.value }))
                }
              />
            </FormFieldShell>
          ) : (
            <FormFieldShell
              fieldId="billing-scheme-business-days"
              label={copy.form.params.businessDays}
              description={copy.form.params.businessDaysHint}
              errorMessage={fieldErrors.businessDays}
            >
              <Input
                id="billing-scheme-business-days"
                type="number"
                min={1}
                max={15}
                value={form.businessDays}
                disabled={isPending || !canMutate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, businessDays: e.target.value }))
                }
              />
            </FormFieldShell>
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="billing-scheme-default">{copy.form.isDefault}</Label>
          <p className="text-xs text-muted-foreground">
            {copy.form.isDefaultHint}
          </p>
        </div>
        <Switch
          id="billing-scheme-default"
          checked={form.isDefault}
          disabled={isPending || !canMutate}
          onCheckedChange={(checked) =>
            setForm((prev) => ({ ...prev, isDefault: checked }))
          }
        />
      </div>

      {canMutate ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {copy.form.save}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
          >
            {copy.form.cancel}
          </Button>
          {!isCreating ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              disabled={isPending}
              onClick={onDeactivate}
            >
              {copy.form.deactivate}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BillingSchemesMasterDetail() {
  const { hasPermission } = usePermissions();
  const canMutate = hasPermission("invoices", "update");
  const { data: schemes = [], isLoading, isError } = useBillingSchemes();
  const createMutation = useCreateBillingScheme();
  const updateMutation = useUpdateBillingScheme();
  const deleteMutation = useDeleteBillingScheme();

  const sorted = useMemo(() => sortSchemes(schemes), [schemes]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BillingScheme | null>(null);

  const isEmpty = sorted.length === 0;
  const showCreateForm = isCreating || (isEmpty && canMutate);

  const preferredId = useMemo(() => {
    const preferred =
      sorted.find((s) => s.isDefault && s.isActive) ??
      sorted.find((s) => s.isDefault) ??
      sorted[0];
    return preferred?.id ?? null;
  }, [sorted]);

  const displaySelectedId = showCreateForm
    ? null
    : selectedId && sorted.some((s) => s.id === selectedId)
      ? selectedId
      : preferredId;

  const selected =
    displaySelectedId != null
      ? (sorted.find((s) => s.id === displaySelectedId) ?? null)
      : null;

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const formInitial = showCreateForm
    ? emptyForm()
    : selected
      ? schemeToForm(selected)
      : emptyForm();

  const formPanelKey = showCreateForm ? "create" : (displaySelectedId ?? "none");

  const handleCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
  };

  const handleSelect = (scheme: BillingScheme) => {
    setSelectedId(scheme.id);
    setIsCreating(false);
  };

  const handleCancel = () => {
    if (showCreateForm && !isEmpty) {
      setSelectedId(preferredId);
      setIsCreating(false);
      return;
    }
    setIsCreating(isEmpty && canMutate);
    setSelectedId(null);
  };

  const handleSave = async (form: FormState) => {
    const payload = {
      name: form.name.trim(),
      cadenceKind: form.cadenceKind,
      params: buildParams(form),
      isDefault: form.isDefault,
    };

    if (displaySelectedId && !showCreateForm) {
      await updateMutation.mutateAsync({ id: displaySelectedId, payload });
      return;
    }

    const created = await createMutation.mutateAsync(payload);
    setSelectedId(created.id);
    setIsCreating(false);
  };

  const confirmDeactivate = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    if (selectedId === deleteTarget.id) {
      setSelectedId(null);
    }
    setIsCreating(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {copy.list.title} ({sorted.length})
        </h2>
        {canMutate ? (
          <Button type="button" size="sm" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {copy.list.add}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <div className="space-y-2 rounded-lg border bg-muted/20 p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              {copy.list.loading}
            </div>
          ) : isError ? (
            <EmptyState
              icon={
                <CalendarClock className="h-10 w-10 text-muted-foreground" />
              }
              title={copy.toast.error}
            />
          ) : isEmpty ? (
            <EmptyState
              icon={
                <CalendarClock className="h-10 w-10 text-muted-foreground" />
              }
              title={copy.list.emptyTitle}
              description={copy.list.emptyDescription}
              cta={
                canMutate
                  ? { label: copy.list.add, onClick: handleCreate }
                  : undefined
              }
            />
          ) : (
            sorted.map((scheme) => (
              <SchemeListRow
                key={scheme.id}
                scheme={scheme}
                selected={scheme.id === displaySelectedId && !showCreateForm}
                onClick={() => handleSelect(scheme)}
              />
            ))
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          {showCreateForm || selected ? (
            <BillingSchemeFormPanel
              key={formPanelKey}
              initial={formInitial}
              isCreating={showCreateForm}
              isPending={isPending}
              canMutate={canMutate}
              onCancel={handleCancel}
              onDeactivate={() => selected && setDeleteTarget(selected)}
              onSave={handleSave}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {copy.list.selectPrompt}
            </p>
          )}
        </div>
      </div>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.delete.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.delete.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.delete.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeactivate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.delete.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
