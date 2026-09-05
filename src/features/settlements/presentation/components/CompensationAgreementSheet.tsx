/**
 * CompensationAgreementSheet
 * @deprecated Cutover ADR-0089 (D11). Usar hub `/finance/compensation/templates` y asignación masiva.
 * Clean Architecture - Presentation Layer (Components)
 *
 * Sheet lateral contextual para configurar esquemas compuestos de compensación a choferes.
 * Soporta sueldo base periódico + matriz de reglas condicionales por tipo de ruta (ADR-0086).
 *
 * Ubicación: src/features/settlements/presentation/components/CompensationAgreementSheet.tsx
 */

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, Controller, useFieldArray, useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Alert, AlertDescription } from "@shared/ui/alert";
import { AlertCircle, Plus, Trash2, Check, Route, Calendar, Banknote, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  DateField,
  FieldInlineError,
  MoneyInput,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useEmployees, useEmployee, type SalaryType } from "@features/employees";
import { useCreateCompensationAgreement, useCompensationAgreements, useUpdateCompensationAgreement } from "../../application/hooks/useAgreements";
import {
  compensationAgreementFormSchema,
  type CompensationAgreementFormData,
} from "../validation/settlementSchemas";
import {
  AGREEMENT_COMMISSION_TYPE_LABELS,
  COMPENSATION_SALARY_PERIOD_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  type AgreementCommissionType,
  type CompensationSalaryPeriod,
  type TripRouteType,
} from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  findActiveOverlappingAgreements,
  subtractOneCalendarDay,
} from "../utils/compensationAgreementOverlap";

interface CompensationAgreementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmployeeId?: string;
  /** When true with defaultEmployeeId, the employee selector is disabled (create-in-context). */
  lockEmployee?: boolean;
  onSuccess?: () => void;
}

function mapEmployeeSalaryTypeToPeriod(salaryType?: SalaryType | null): CompensationSalaryPeriod {
  if (!salaryType) return "weekly";
  switch (salaryType) {
    case "weekly":
      return "weekly";
    case "biweekly":
      return "biweekly";
    case "monthly":
      return "monthly";
    case "daily":
      return "weekly";
    default:
      return "weekly";
  }
}

const DEFAULT_RULES = [
  {
    routeType: "long_haul" as TripRouteType,
    commissionType: "rate_per_km" as AgreementCommissionType,
    rateValue: 3.0,
    minimumGuaranteedAmount: 400,
    notes: "Ruta foránea estándar",
  },
];

interface AgreementRuleRowProps {
  index: number;
  control: Control<CompensationAgreementFormData>;
  register: UseFormRegister<CompensationAgreementFormData>;
  canRemove: boolean;
  onRemove: (index: number) => void;
  copy: typeof settlementsCopy.agreementsDialog;
}

function AgreementRuleRow({
  index,
  control,
  register,
  canRemove,
  onRemove,
  copy,
}: AgreementRuleRowProps) {
  const commissionType = useWatch({
    control,
    name: `rules.${index}.commissionType`,
  });

  return (
    <div className="rounded-lg border bg-muted/15 p-3.5 space-y-3 relative group">
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {/* Tipo de Ruta */}
          <div className="space-y-1.5">
            <Label className="text-xs">{copy.routeTypeLabel}</Label>
            <Controller
              control={control}
              name={`rules.${index}.routeType`}
              render={({ field: routeField }) => (
                <Select
                  value={routeField.value}
                  onValueChange={routeField.onChange}
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        TRIP_ROUTE_TYPE_LABELS,
                      ) as TripRouteType[]
                    ).map((rk) => (
                      <SelectItem key={rk} value={rk} className="text-xs">
                        {TRIP_ROUTE_TYPE_LABELS[rk]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tipo de Comisión */}
          <div className="space-y-1.5">
            <Label className="text-xs">{copy.calculationTypeLabel}</Label>
            <Controller
              control={control}
              name={`rules.${index}.commissionType`}
              render={({ field: commField }) => (
                <Select
                  value={commField.value}
                  onValueChange={commField.onChange}
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue placeholder={copy.calculationTypePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        AGREEMENT_COMMISSION_TYPE_LABELS,
                      ) as AgreementCommissionType[]
                    ).map((ck) => (
                      <SelectItem key={ck} value={ck} className="text-xs">
                        {AGREEMENT_COMMISSION_TYPE_LABELS[ck]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-5"
            title="Eliminar condición"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Parámetros de valor según tipo de comisión */}
      {commissionType !== "none" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed">
          <div className="space-y-1">
            <Label className="text-xs">
              {commissionType === "rate_per_km" && copy.ratePerKmLabel}
              {commissionType === "percentage_of_freight" && copy.percentageRateLabel}
              {commissionType === "fixed_per_trip" && copy.baseRateLabel}
            </Label>
            <Input
              type="number"
              step={commissionType === "rate_per_km" ? "0.01" : commissionType === "percentage_of_freight" ? "0.1" : "1"}
              min="0"
              max={commissionType === "percentage_of_freight" ? "100" : undefined}
              className="h-8 text-xs tabular-nums bg-card"
              {...register(`rules.${index}.rateValue`, { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{copy.minimumGuaranteedLabel}</Label>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="0 si no aplica"
              className="h-8 text-xs tabular-nums bg-card"
              {...register(`rules.${index}.minimumGuaranteedAmount`, { valueAsNumber: true })}
            />
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-muted-foreground italic bg-muted/40 p-2.5 rounded-md border border-dashed">
          {copy.localCoveredNote}
        </div>
      )}
    </div>
  );
}

export function CompensationAgreementSheet({
  open,
  onOpenChange,
  defaultEmployeeId,
  lockEmployee = false,
  onSuccess,
}: CompensationAgreementSheetProps) {
  const copy = settlementsCopy.agreementsDialog;
  const governanceCopy = settlementsCopy.agreementGovernance;
  const { toast } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  const [closePreviousOnCreate, setClosePreviousOnCreate] = useState(true);
  const { data: employeesData } = useEmployees({ limit: 100, isActive: true });
  const createMutation = useCreateCompensationAgreement();
  const updateMutation = useUpdateCompensationAgreement();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompensationAgreementFormData>({
    resolver: zodResolver(compensationAgreementFormSchema) as never,
    defaultValues: {
      employeeId: defaultEmployeeId ?? "",
      hasFixedSalary: true,
      fixedSalaryAmount: 3000,
      fixedSalaryPeriod: "weekly",
      isSalaryGuaranteed: true,
      rules: DEFAULT_RULES,
      calculationType: "rate_per_km",
      baseRate: 0,
      ratePerKm: 0,
      percentageRate: 0,
      helperDailyRate: 0,
      currency: "MXN",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rules",
  });

  const selectedEmployeeId = watch("employeeId");
  const effectiveFrom = watch("effectiveFrom");
  const effectiveTo = watch("effectiveTo");
  const hasFixedSalary = watch("hasFixedSalary");
  const fixedSalaryAmount = watch("fixedSalaryAmount") ?? 0;
  const fixedSalaryPeriod = watch("fixedSalaryPeriod");
  const isSalaryGuaranteed = watch("isSalaryGuaranteed");
  const rules = watch("rules") ?? [];

  const { data: employeeAgreements = [] } = useCompensationAgreements(
    selectedEmployeeId || undefined,
  );

  const overlappingAgreements = useMemo(() => {
    if (!selectedEmployeeId || !effectiveFrom) return [];
    return findActiveOverlappingAgreements(employeeAgreements, {
      employeeId: selectedEmployeeId,
      effectiveFrom,
      effectiveTo,
    });
  }, [employeeAgreements, selectedEmployeeId, effectiveFrom, effectiveTo]);

  // Consulta reactiva del detalle laboral del empleado seleccionado
  const { data: employeeDetailResult } = useEmployee(
    selectedEmployeeId,
    Boolean(selectedEmployeeId),
  );
  const employeeDetail = employeeDetailResult?.data;

  // Track de último ID de empleado auto-sincronizado para evitar sobreescribir ediciones manuales
  const lastSyncedEmployeeIdRef = useRef<string | null>(null);
  const [isSalarySuggestedFromProfile, setIsSalarySuggestedFromProfile] = useState(false);

  // Sincronización inteligente de sueldo base al cambiar de empleado
  useEffect(() => {
    if (!selectedEmployeeId) {
      lastSyncedEmployeeIdRef.current = null;
      setIsSalarySuggestedFromProfile(false);
      return;
    }

    if (employeeDetail && employeeDetail.id === selectedEmployeeId) {
      if (lastSyncedEmployeeIdRef.current !== selectedEmployeeId) {
        lastSyncedEmployeeIdRef.current = selectedEmployeeId;

        if (employeeDetail.baseSalary && employeeDetail.baseSalary > 0) {
          setValue("hasFixedSalary", true, { shouldValidate: true });
          setValue("fixedSalaryAmount", employeeDetail.baseSalary, { shouldValidate: true });
          setValue(
            "fixedSalaryPeriod",
            mapEmployeeSalaryTypeToPeriod(employeeDetail.salaryType),
            { shouldValidate: true },
          );
          setIsSalarySuggestedFromProfile(true);
        } else {
          setValue("hasFixedSalary", false, { shouldValidate: true });
          setValue("fixedSalaryAmount", 0, { shouldValidate: true });
          setIsSalarySuggestedFromProfile(false);
        }
      }
    }
  }, [selectedEmployeeId, employeeDetail, setValue]);

  // Resumen en prosa reactivo y operativo
  const summaryText = useMemo(() => {
    const parts: string[] = [];
    if (hasFixedSalary && fixedSalaryAmount > 0) {
      const periodLabel =
        COMPENSATION_SALARY_PERIOD_LABELS[fixedSalaryPeriod as CompensationSalaryPeriod] ?? "semanal";
      const guaranteeNote = isSalaryGuaranteed ? " (garantizado)" : "";
      parts.push(
        `Sueldo fijo: ${formatMxCurrency(fixedSalaryAmount)} ${periodLabel.toLowerCase()}${guaranteeNote}`,
      );
    }

    if (rules.length > 0) {
      const ruleSummaries = rules.map((r) => {
        const route = TRIP_ROUTE_TYPE_LABELS[r.routeType as TripRouteType] ?? r.routeType;
        if (r.commissionType === "none") {
          return `${route}: sin comisión extra (cubierto por sueldo)`;
        }
        if (r.commissionType === "rate_per_km") {
          const minNote =
            r.minimumGuaranteedAmount && r.minimumGuaranteedAmount > 0
              ? ` (mín. ${formatMxCurrency(r.minimumGuaranteedAmount)})`
              : "";
          return `${route}: ${formatMxCurrency(r.rateValue)}/km${minNote}`;
        }
        if (r.commissionType === "percentage_of_freight") {
          return `${route}: ${r.rateValue}% flete`;
        }
        if (r.commissionType === "fixed_per_trip") {
          return `${route}: ${formatMxCurrency(r.rateValue)}/viaje`;
        }
        return `${route}: variable`;
      });
      parts.push(`Comisiones: ${ruleSummaries.join(" · ")}`);
    }

    if (parts.length === 0) {
      return "Sin condiciones configuradas.";
    }

    return parts.join(" + ");
  }, [hasFixedSalary, fixedSalaryAmount, fixedSalaryPeriod, isSalaryGuaranteed, rules]);

  useEffect(() => {
    if (open) {
      setApiError(null);
      setClosePreviousOnCreate(true);
      lastSyncedEmployeeIdRef.current = null;
      setIsSalarySuggestedFromProfile(false);
      reset({
        employeeId: defaultEmployeeId ?? "",
        hasFixedSalary: true,
        fixedSalaryAmount: 3000,
        fixedSalaryPeriod: "weekly",
        isSalaryGuaranteed: true,
        rules: DEFAULT_RULES,
        calculationType: "rate_per_km",
        baseRate: 0,
        ratePerKm: 0,
        percentageRate: 0,
        helperDailyRate: 0,
        currency: "MXN",
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: "",
        notes: "",
      });
    }
  }, [open, defaultEmployeeId, reset]);

  const onSubmit = async (data: CompensationAgreementFormData) => {
    try {
      setApiError(null);

      if (closePreviousOnCreate && overlappingAgreements.length > 0) {
        const closeDate = subtractOneCalendarDay(data.effectiveFrom);
        for (const existing of overlappingAgreements) {
          await updateMutation.mutateAsync({
            id: existing.id,
            employeeId: data.employeeId,
            effectiveTo: closeDate,
          });
        }
      }

      await createMutation.mutateAsync(data);
      toast({
        title: copy.toastSuccess,
        variant: "success",
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
    }
  };

  const employees = employeesData?.data ?? [];

  const handleAddRule = () => {
    append({
      routeType: "long_haul",
      commissionType: "rate_per_km",
      rateValue: 0,
      minimumGuaranteedAmount: 0,
      notes: "",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background"
        onFocusOutside={(e) => e.preventDefault()}
      >
        {/* HEADER STICKY */}
        <SheetHeader className="px-6 py-4 border-b bg-card shrink-0">
          <SheetTitle className="text-lg font-semibold text-foreground">
            {copy.title}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {copy.description}
          </SheetDescription>
        </SheetHeader>

        {/* CONTENIDO SCROLLABLE INDEPENDIENTE */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {apiError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          <form id="compensation-agreement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* BLOQUE 1: IDENTIFICACIÓN Y VIGENCIA */}
            <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b pb-2.5">
                <Calendar className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  1. Identificación y Vigencia
                </h4>
              </div>

              {/* OPERADOR */}
              <div className="space-y-1.5">
                <Label htmlFor="agr-employee">{copy.employeeLabel}</Label>
                <Select
                  value={selectedEmployeeId || ""}
                  onValueChange={(val) => setValue("employeeId", val, { shouldValidate: true })}
                  disabled={lockEmployee && Boolean(defaultEmployeeId)}
                >
                  <SelectTrigger
                    id="agr-employee"
                    {...getFieldErrorAriaProps("agr-employee", errors.employeeId?.message)}
                  >
                    <SelectValue placeholder={copy.employeePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber ?? emp.id.slice(0, 8)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldInlineError fieldId="agr-employee" message={errors.employeeId?.message} />
              </div>

              {/* VIGENCIA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="agr-from">{copy.effectiveFromLabel}</Label>
                  <Controller
                    control={control}
                    name="effectiveFrom"
                    render={({ field, fieldState }) => (
                      <DateField
                        id="agr-from"
                        name={field.name}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error)}
                        {...getFieldErrorAriaProps("agr-from", fieldState.error?.message)}
                      />
                    )}
                  />
                  <FieldInlineError fieldId="agr-from" message={errors.effectiveFrom?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agr-to">{copy.effectiveToLabel}</Label>
                  <Controller
                    control={control}
                    name="effectiveTo"
                    render={({ field, fieldState }) => (
                      <DateField
                        id="agr-to"
                        name={field.name}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error)}
                        {...getFieldErrorAriaProps("agr-to", fieldState.error?.message)}
                      />
                    )}
                  />
                  <FieldInlineError fieldId="agr-to" message={errors.effectiveTo?.message} />
                </div>
              </div>

              {overlappingAgreements.length > 0 && (
                <Alert variant="warning" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {governanceCopy.overlapCreateTitle}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {governanceCopy.overlapCreateDescription}
                      </p>
                    </div>
                    <label
                      htmlFor="agr-close-previous"
                      className="flex items-start gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        id="agr-close-previous"
                        checked={closePreviousOnCreate}
                        onCheckedChange={(checked) =>
                          setClosePreviousOnCreate(checked === true)
                        }
                        className="mt-0.5"
                      />
                      <span>{governanceCopy.overlapCreateClosePreviousLabel}</span>
                    </label>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* BLOQUE 2: SUELDO BASE RECURRENTE */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  <div>
                    <Label htmlFor="agr-has-fixed-salary" className="font-semibold text-sm cursor-pointer">
                      2. {copy.fixedSalarySectionTitle}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {copy.fixedSalarySectionDescription}
                    </p>
                  </div>
                </div>
                <Controller
                  control={control}
                  name="hasFixedSalary"
                  render={({ field }) => (
                    <Checkbox
                      id="agr-has-fixed-salary"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {isSalarySuggestedFromProfile && hasFixedSalary && (
                <div className="flex items-center gap-2 text-xs text-primary/90 bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5 font-medium">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{copy.fixedSalarySuggestedNotice}</span>
                </div>
              )}

              {hasFixedSalary && (
                <div className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="agr-fixed-amount">{copy.fixedSalaryAmountLabel}</Label>
                      <Controller
                        control={control}
                        name="fixedSalaryAmount"
                        render={({ field, fieldState }) => (
                          <MoneyInput
                            id="agr-fixed-amount"
                            name={field.name}
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            currencyCode="MXN"
                            decimals={2}
                            error={Boolean(fieldState.error)}
                          />
                        )}
                      />
                      <FieldInlineError fieldId="agr-fixed-amount" message={errors.fixedSalaryAmount?.message} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="agr-fixed-period">{copy.fixedSalaryPeriodLabel}</Label>
                      <Select
                        value={fixedSalaryPeriod || "weekly"}
                        onValueChange={(val) =>
                          setValue("fixedSalaryPeriod", val as CompensationSalaryPeriod, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger id="agr-fixed-period">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(
                              COMPENSATION_SALARY_PERIOD_LABELS,
                            ) as CompensationSalaryPeriod[]
                          ).map((k) => (
                            <SelectItem key={k} value={k}>
                              {COMPENSATION_SALARY_PERIOD_LABELS[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-dashed">
                    <Controller
                      control={control}
                      name="isSalaryGuaranteed"
                      render={({ field }) => (
                        <Checkbox
                          id="agr-is-guaranteed"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="agr-is-guaranteed" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                      {copy.fixedSalaryGuaranteedLabel}
                    </Label>
                  </div>
                </div>
              )}
            </div>

            {/* BLOQUE 3: COMISIONES POR TIPO DE VIAJE */}
            <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      3. {copy.routesSectionTitle}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {copy.routesSectionDescription}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRule}
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {copy.addRuleButton}
                </Button>
              </div>

              <div className="space-y-3 pt-1">
                {fields.map((field, index) => (
                  <AgreementRuleRow
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    canRemove={fields.length > 1}
                    onRemove={remove}
                    copy={copy}
                  />
                ))}
              </div>
            </div>

            {/* BLOQUE 4: OBSERVACIONES */}
            <div className="space-y-1.5">
              <Label htmlFor="agr-notes">{copy.notesLabel}</Label>
              <Textarea
                id="agr-notes"
                rows={2}
                placeholder={copy.notesPlaceholder}
                {...register("notes")}
                {...getRegisterFieldErrorProps("agr-notes", errors.notes?.message)}
              />
              <FieldInlineError fieldId="agr-notes" message={errors.notes?.message} />
            </div>
          </form>
        </div>

        {/* FOOTER STICKY CON RESUMEN OPERATIVO */}
        <SheetFooter className="p-4 border-t bg-card shrink-0 flex flex-col gap-3 sm:flex-col">
          {/* BANNER RESUMEN EN LENGUAJE NATURAL */}
          <div className="w-full rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground space-y-1">
            <div className="font-semibold text-primary flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Resumen del acuerdo:
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {summaryText}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 w-full pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || createMutation.isPending}
            >
              {settlementsCopy.actions.cancel}
            </Button>
            <Button
              type="submit"
              form="compensation-agreement-form"
              disabled={isSubmitting || createMutation.isPending}
            >
              {createMutation.isPending ? copy.saving : copy.save}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
