/**
 * Catálogo de esquemas de facturación (ADR-0082).
 * Master-detail Settings — consulta en panel + edición en Sheet.
 */

import { useMemo, useState } from "react";
import { CalendarClock, ChevronDown, Loader2, Plus } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { cn } from "@shared/lib/utils/cn";
import { formatDateTime } from "@shared/utils/dateUtils";
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
import {
  buildBillingSchemePreviewParams,
  formatBillingSchemeCadenceSummary,
  formatBillingSchemeNaturalDescription,
  formatBillingSchemePeriodExample,
  formatBillingSchemePeriodRuleBullets,
} from "../utils/formatBillingSchemeCadence";
import {
  SETTINGS_SHEET_BODY_CLASS,
  SETTINGS_SHEET_CONTENT_CLASS,
  SETTINGS_SHEET_FOOTER_CLASS,
  SETTINGS_SHEET_HEADER_CLASS,
  SETTINGS_SHEET_PRIMARY_BUTTON_CLASS,
} from "./settingsSheetLayout";

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

type SheetMode = "create" | "edit";

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

interface BillingSchemeDetailViewProps {
  scheme: BillingScheme;
  canMutate: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
}

function BillingSchemeDetailView({
  scheme,
  canMutate,
  onEdit,
  onDeactivate,
}: BillingSchemeDetailViewProps) {
  const periodBullets = formatBillingSchemePeriodRuleBullets(scheme);
  const periodExample = formatBillingSchemePeriodExample(scheme);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{scheme.name}</h3>
          <div className="flex flex-wrap gap-2">
            {scheme.isDefault ? (
              <Badge variant="secondary">{copy.list.defaultBadge}</Badge>
            ) : null}
            {!scheme.isActive ? (
              <Badge variant="outline">{copy.list.inactiveBadge}</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-medium">{copy.detail.summaryTitle}</h4>
        <p className="text-sm text-muted-foreground">
          {formatBillingSchemeNaturalDescription(scheme)}
        </p>
      </section>

      <section className="space-y-2 rounded-md border bg-muted/20 p-3">
        <div className="flex items-start gap-2">
          <CalendarClock
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="space-y-1">
            <h4 className="text-sm font-medium">
              {copy.detail.periodExampleTitle}
            </h4>
            <p className="text-sm text-muted-foreground">{periodExample}</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium">{copy.detail.periodRuleTitle}</h4>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {periodBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted/50">
          {copy.detail.detailsTitle}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 px-1 pt-2 text-xs text-muted-foreground">
          <p>{copy.detail.createdAt(formatDateTime(scheme.createdAt))}</p>
          <p>{copy.detail.updatedAt(formatDateTime(scheme.updatedAt))}</p>
        </CollapsibleContent>
      </Collapsible>

      {canMutate ? (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button type="button" onClick={onEdit}>
            {copy.detail.edit}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            onClick={onDeactivate}
          >
            {copy.detail.deactivate}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface BillingSchemeFormPanelProps {
  initial: FormState;
  isPending: boolean;
  canMutate: boolean;
  onSave: (form: FormState) => Promise<void>;
}

function BillingSchemeFormPanel({
  initial,
  isPending,
  canMutate,
  onSave,
}: BillingSchemeFormPanelProps) {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const monthDays = parseMonthDays(form.monthDays);
  const windowHours = Number(form.windowHours);
  const businessDays = Number(form.businessDays);
  const previewText = formatBillingSchemeNaturalDescription({
    cadenceKind: form.cadenceKind,
    params: buildBillingSchemePreviewParams({
      cadenceKind: form.cadenceKind,
      windowHours:
        Number.isFinite(windowHours) && windowHours > 0 ? windowHours : 48,
      weekdays: form.weekdays,
      monthDays,
      monthlyMode: form.monthlyMode,
      businessDays:
        Number.isInteger(businessDays) && businessDays >= 1 ? businessDays : 3,
    }),
  });

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

      <div className="flex items-start gap-2 rounded-md border bg-muted/20 px-3 py-2">
        <CalendarClock
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground">
            {copy.form.previewLabel}
          </p>
          <p className="text-xs text-muted-foreground">{previewText}</p>
        </div>
      </div>

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
        <SheetFooter className={SETTINGS_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isPending}
            className={SETTINGS_SHEET_PRIMARY_BUTTON_CLASS}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {copy.form.save}
          </Button>
        </SheetFooter>
      ) : null}
    </div>
  );
}

interface BillingSchemeFormSheetProps {
  open: boolean;
  mode: SheetMode | null;
  scheme: BillingScheme | null;
  isPending: boolean;
  canMutate: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: FormState) => Promise<void>;
}

function BillingSchemeFormSheet({
  open,
  mode,
  scheme,
  isPending,
  canMutate,
  onOpenChange,
  onSave,
}: BillingSchemeFormSheetProps) {
  const isCreating = mode === "create";
  const formInitial = isCreating
    ? emptyForm()
    : scheme
      ? schemeToForm(scheme)
      : emptyForm();
  const formKey = isCreating ? "create" : (scheme?.id ?? "edit");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={SETTINGS_SHEET_CONTENT_CLASS}
        side="right"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className={SETTINGS_SHEET_HEADER_CLASS}>
          <SheetTitle>
            {isCreating ? copy.form.createTitle : copy.form.editTitle}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? copy.form.createDescription
              : copy.form.editDescription}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <div className={SETTINGS_SHEET_BODY_CLASS}>
            <BillingSchemeFormPanel
              key={formKey}
              initial={formInitial}
              isPending={isPending}
              canMutate={canMutate}
              onSave={onSave}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
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
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BillingScheme | null>(null);

  const isEmpty = sorted.length === 0;
  const sheetOpen = sheetMode != null;

  const preferredId = useMemo(() => {
    const preferred =
      sorted.find((s) => s.isDefault && s.isActive) ??
      sorted.find((s) => s.isDefault) ??
      sorted[0];
    return preferred?.id ?? null;
  }, [sorted]);

  const displaySelectedId =
    selectedId && sorted.some((s) => s.id === selectedId)
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

  const handleOpenCreate = () => {
    setSheetMode("create");
  };

  const handleOpenEdit = () => {
    setSheetMode("edit");
  };

  const handleSelect = (scheme: BillingScheme) => {
    setSelectedId(scheme.id);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) setSheetMode(null);
  };

  const handleSave = async (form: FormState) => {
    const payload = {
      name: form.name.trim(),
      cadenceKind: form.cadenceKind,
      params: buildParams(form),
      isDefault: form.isDefault,
    };

    if (sheetMode === "edit" && selected) {
      await updateMutation.mutateAsync({ id: selected.id, payload });
      setSheetMode(null);
      return;
    }

    const created = await createMutation.mutateAsync(payload);
    setSelectedId(created.id);
    setSheetMode(null);
  };

  const confirmDeactivate = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    if (selectedId === deleteTarget.id) {
      setSelectedId(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {copy.list.title} ({sorted.length})
        </h2>
        {canMutate ? (
          <Button type="button" size="sm" onClick={handleOpenCreate}>
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
                  ? { label: copy.list.add, onClick: handleOpenCreate }
                  : undefined
              }
            />
          ) : (
            sorted.map((scheme) => (
              <SchemeListRow
                key={scheme.id}
                scheme={scheme}
                selected={scheme.id === displaySelectedId}
                onClick={() => handleSelect(scheme)}
              />
            ))
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          {selected ? (
            <BillingSchemeDetailView
              scheme={selected}
              canMutate={canMutate}
              onEdit={handleOpenEdit}
              onDeactivate={() => setDeleteTarget(selected)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {copy.list.selectPrompt}
            </p>
          )}
        </div>
      </div>

      <BillingSchemeFormSheet
        open={sheetOpen}
        mode={sheetMode}
        scheme={selected}
        isPending={isPending}
        canMutate={canMutate}
        onOpenChange={handleSheetOpenChange}
        onSave={handleSave}
      />

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
