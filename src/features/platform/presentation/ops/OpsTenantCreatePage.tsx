import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Sparkles } from "lucide-react";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { mapBackendError } from "@shared/utils/errorMapper";
import { generateSecurePassword } from "@shared/utils/generateSecurePassword";
import { isPlatformOwner } from "../../domain/entities";
import {
  useCreatePlatformTenant,
  usePlatformPlans,
} from "../../application/hooks/usePlatformTenants";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import {
  createPlatformTenantSchema,
  type CreatePlatformTenantFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";
import {
  formatPlanPriceCents,
  formatPlanSelectLabel,
  isMotrizListPrice,
} from "../utils/formatPlanLabel";
import { formatPlatformLimitValue } from "../utils/platformBillingFormatters";
import {
  DECLARED_FLEET_BANDS,
  DEFAULT_OPERATIONAL_PLAN_CODE,
  recommendOperationalPlanCode,
} from "../utils/recommendOperationalPlan";
import { opsCopy } from "./opsCopy";
import { OpsUnsavedChangesDialog } from "./OpsUnsavedChangesDialog";
import { OpsAlert } from "./ui/OpsAlert";
import { OpsBadge } from "./ui/OpsBadge";
import { OpsButton } from "./ui/OpsButton";
import { OpsFieldError, OpsFormErrors } from "./ui/OpsFieldError";
import { OpsInput } from "./ui/OpsInput";
import { OpsLabel } from "./ui/OpsLabel";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "./ui/OpsPanel";
import {
  OpsSelect,
  OpsSelectContent,
  OpsSelectItem,
  OpsSelectTrigger,
  OpsSelectValue,
} from "./ui/OpsSelect";

const FLEET_BAND_NONE = "__none__";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-xs">
      <span className="ops-text-muted">{label}</span>
      <span className="ops-text tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Alta empresa Ops (flag ON) — OpsPanel/Input/Select, sin Card/FormPageShell light.
 */
export function OpsTenantCreatePage() {
  const copy = platformCopy.tenants.create;
  const opsCreate = opsCopy.create;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const { data: plans, isLoading: plansLoading } = usePlatformPlans();
  const planManuallyOverridden = useRef(false);
  const wasSubmittingRef = useRef(false);
  const [showPassword, setShowPassword] = useState(false);

  const canCreate = Boolean(user && isPlatformOwner(user.platformRole));

  useEffect(() => {
    if (user && !isPlatformOwner(user.platformRole)) {
      navigate("/platform/tenants", { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitted, isDirty },
  } = useForm<CreatePlatformTenantFormData, unknown, CreatePlatformTenantFormData>({
    resolver: zodResolver(createPlatformTenantSchema) as Resolver<
      CreatePlatformTenantFormData
    >,
    mode: "onBlur",
    defaultValues: {
      companyName: "",
      subdomain: "",
      adminEmail: "",
      adminPassword: "",
      adminFirstName: "",
      adminLastName: "",
      planCode: DEFAULT_OPERATIONAL_PLAN_CODE,
      declaredFleetBand: null,
    },
  });

  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });

  const subdomainValue = useWatch({ control, name: "subdomain" }) ?? "";
  const planCodeValue = useWatch({ control, name: "planCode" }) ?? "";
  const fleetBandValue = useWatch({ control, name: "declaredFleetBand" });
  const adminPasswordValue = useWatch({ control, name: "adminPassword" }) ?? "";

  useEffect(() => {
    if (!plans?.length) return;
    const hasDefault = plans.some(
      (plan) => plan.code === DEFAULT_OPERATIONAL_PLAN_CODE,
    );
    if (!planCodeValue) {
      setValue(
        "planCode",
        hasDefault ? DEFAULT_OPERATIONAL_PLAN_CODE : plans[0].code,
      );
    }
  }, [plans, planCodeValue, setValue]);

  const recommendedPlanCode = useMemo(
    () =>
      recommendOperationalPlanCode({
        band: fleetBandValue ?? null,
      }),
    [fleetBandValue],
  );

  const selectedPlan = useMemo(
    () => plans?.find((plan) => plan.code === planCodeValue),
    [plans, planCodeValue],
  );

  const createMutation = useCreatePlatformTenant({
    onSuccess: (result) => {
      allowLeave();
      const activationStatus = result.data.adminActivation?.status;
      if (activationStatus === "email_failed") {
        toast({
          title: copy.successEmailFailed,
          description: copy.successEmailFailedHint,
          variant: "warning",
        });
      } else if (activationStatus === "pending") {
        toast({ title: copy.successPending, variant: "success" });
      } else {
        toast({ title: copy.success, variant: "success" });
      }
      navigate(`/platform/tenants/${result.data.tenant.id}`);
    },
  });

  useEffect(() => {
    if (createMutation.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [createMutation.isPending, resetAllowLeave]);

  const handleFleetBandChange = (value: string) => {
    const band =
      value === FLEET_BAND_NONE
        ? null
        : (value as (typeof DECLARED_FLEET_BANDS)[number]);
    setValue("declaredFleetBand", band, { shouldValidate: true });
    if (!planManuallyOverridden.current) {
      setValue("planCode", recommendOperationalPlanCode({ band }), {
        shouldValidate: true,
      });
    }
  };

  const handlePlanChange = (value: string) => {
    planManuallyOverridden.current = true;
    setValue("planCode", value, { shouldValidate: true });
  };

  const handleGeneratePassword = () => {
    const next = generateSecurePassword(16);
    setValue("adminPassword", next, { shouldValidate: true, shouldDirty: true });
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    const value = adminPasswordValue?.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: copy.passwordActions.copied, variant: "success" });
    } catch {
      toast({ title: copy.passwordActions.copyError, variant: "error" });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      await createMutation.mutateAsync({
        company: {
          name: values.companyName,
          subdomain: values.subdomain.toLowerCase(),
        },
        admin: {
          email: values.adminEmail,
          password: values.adminPassword,
          firstName: values.adminFirstName,
          lastName: values.adminLastName,
        },
        planCode: values.planCode,
        declaredFleetBand: values.declaredFleetBand ?? null,
      });
    } catch (error) {
      const mapped = mapBackendError(error);
      setError("root", { message: mapped.message });
    }
  });

  const summaryErrors = isSubmitted ? collectFieldErrorMessages(errors) : [];
  const normalizedSubdomain = subdomainValue.trim().toLowerCase();
  const fleetSelectValue = fleetBandValue ?? FLEET_BAND_NONE;

  if (!user || !canCreate) {
    return (
      <div data-testid="platform-ops-tenant-create" className="ops-text-muted text-sm">
        Cargando…
      </div>
    );
  }

  return (
    <>
      <div data-testid="platform-ops-tenant-create" className="space-y-3">
        <div>
          <Link
            to="/platform/tenants"
            className="text-xs ops-text-accent hover:underline"
          >
            ← {copy.back}
          </Link>
          <h1 className="mt-2 ops-type-h2 ops-text m-0">
            {opsCreate.title}
          </h1>
          <p className="mt-1 max-w-xl text-xs ops-text-muted">
            {opsCreate.description}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mx-auto max-w-3xl space-y-3"
          noValidate
        >
          {errors.root?.message ? (
            <OpsAlert tone="danger" title={copy.error}>
              {errors.root.message}
            </OpsAlert>
          ) : null}

          <OpsPanel>
            <OpsPanelHeader>
              <OpsPanelTitle>{copy.sections.company}</OpsPanelTitle>
              <OpsPanelDescription>
                {copy.sections.companyDescription}
              </OpsPanelDescription>
            </OpsPanelHeader>
            <OpsPanelBody className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <OpsLabel htmlFor="companyName">
                  {copy.fields.companyName} *
                </OpsLabel>
                <OpsInput
                  id="companyName"
                  autoComplete="organization"
                  {...register("companyName")}
                  {...getRegisterFieldErrorProps(
                    "companyName",
                    errors.companyName?.message,
                  )}
                />
                <OpsFieldError
                  fieldId="companyName"
                  message={errors.companyName?.message}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <OpsLabel htmlFor="subdomain">
                  {copy.fields.subdomain} *
                </OpsLabel>
                <OpsInput
                  id="subdomain"
                  autoComplete="off"
                  spellCheck={false}
                  {...register("subdomain")}
                  {...getRegisterFieldErrorProps(
                    "subdomain",
                    errors.subdomain?.message,
                  )}
                />
                <p className="text-[11px] ops-text-muted">
                  {copy.hints.subdomain}
                </p>
                <p className="text-[11px] font-medium ops-text-muted">
                  {copy.hints.subdomainPreview(normalizedSubdomain)}
                </p>
                <OpsFieldError
                  fieldId="subdomain"
                  message={errors.subdomain?.message}
                />
              </div>
            </OpsPanelBody>
          </OpsPanel>

          <OpsPanel>
            <OpsPanelHeader>
              <OpsPanelTitle>{copy.sections.admin}</OpsPanelTitle>
              <OpsPanelDescription>
                {copy.sections.adminDescription}
              </OpsPanelDescription>
            </OpsPanelHeader>
            <OpsPanelBody className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <OpsLabel htmlFor="adminEmail">
                  {copy.fields.adminEmail} *
                </OpsLabel>
                <OpsInput
                  id="adminEmail"
                  type="email"
                  autoComplete="off"
                  {...register("adminEmail")}
                  {...getRegisterFieldErrorProps(
                    "adminEmail",
                    errors.adminEmail?.message,
                  )}
                />
                <p className="text-[11px] ops-text-muted">
                  {copy.hints.adminEmail}
                </p>
                <OpsFieldError
                  fieldId="adminEmail"
                  message={errors.adminEmail?.message}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <OpsLabel htmlFor="adminPassword">
                  {copy.fields.adminPassword} *
                </OpsLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <OpsInput
                    id="adminPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className="min-w-0 flex-1"
                    {...register("adminPassword")}
                    {...getRegisterFieldErrorProps(
                      "adminPassword",
                      errors.adminPassword?.message,
                    )}
                  />
                  <div className="flex gap-1">
                    <OpsButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword
                        ? copy.passwordActions.hide
                        : copy.passwordActions.show}
                    </OpsButton>
                    <OpsButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={copy.passwordActions.copy}
                      disabled={!adminPasswordValue?.trim()}
                      onClick={() => void handleCopyPassword()}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </OpsButton>
                    <OpsButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGeneratePassword}
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      {copy.passwordActions.generate}
                    </OpsButton>
                  </div>
                </div>
                <p className="text-[11px] ops-text-muted">
                  {copy.hints.adminPassword}
                </p>
                <OpsFieldError
                  fieldId="adminPassword"
                  message={errors.adminPassword?.message}
                />
              </div>
              <div className="space-y-1">
                <OpsLabel htmlFor="adminFirstName">
                  {copy.fields.adminFirstName} *
                </OpsLabel>
                <OpsInput
                  id="adminFirstName"
                  autoComplete="given-name"
                  {...register("adminFirstName")}
                  {...getRegisterFieldErrorProps(
                    "adminFirstName",
                    errors.adminFirstName?.message,
                  )}
                />
                <OpsFieldError
                  fieldId="adminFirstName"
                  message={errors.adminFirstName?.message}
                />
              </div>
              <div className="space-y-1">
                <OpsLabel htmlFor="adminLastName">
                  {copy.fields.adminLastName} *
                </OpsLabel>
                <OpsInput
                  id="adminLastName"
                  autoComplete="family-name"
                  {...register("adminLastName")}
                  {...getRegisterFieldErrorProps(
                    "adminLastName",
                    errors.adminLastName?.message,
                  )}
                />
                <OpsFieldError
                  fieldId="adminLastName"
                  message={errors.adminLastName?.message}
                />
              </div>
            </OpsPanelBody>
          </OpsPanel>

          <OpsPanel>
            <OpsPanelHeader>
              <OpsPanelTitle>{copy.sections.plan}</OpsPanelTitle>
              <OpsPanelDescription>
                {copy.sections.planDescription}
              </OpsPanelDescription>
            </OpsPanelHeader>
            <OpsPanelBody className="space-y-3">
              <div className="space-y-1">
                <OpsLabel htmlFor="declaredFleetBand">
                  {copy.fields.fleetBand}
                </OpsLabel>
                <OpsSelect
                  value={fleetSelectValue}
                  onValueChange={handleFleetBandChange}
                >
                  <OpsSelectTrigger id="declaredFleetBand">
                    <OpsSelectValue
                      placeholder={copy.fields.fleetBandPlaceholder}
                    />
                  </OpsSelectTrigger>
                  <OpsSelectContent>
                    <OpsSelectItem value={FLEET_BAND_NONE}>
                      {copy.fields.fleetBandNone}
                    </OpsSelectItem>
                    {DECLARED_FLEET_BANDS.map((band) => (
                      <OpsSelectItem key={band} value={band}>
                        {copy.fleetBands[band]}
                      </OpsSelectItem>
                    ))}
                  </OpsSelectContent>
                </OpsSelect>
                <p className="text-[11px] ops-text-muted">
                  {copy.hints.fleetBand}
                </p>
              </div>

              <div className="space-y-1">
                <OpsLabel htmlFor="planCode">{copy.fields.plan} *</OpsLabel>
                <OpsSelect
                  value={planCodeValue}
                  onValueChange={handlePlanChange}
                  disabled={plansLoading || !plans?.length}
                >
                  <OpsSelectTrigger
                    id="planCode"
                    error={Boolean(errors.planCode)}
                    aria-invalid={errors.planCode ? true : undefined}
                    aria-describedby={
                      errors.planCode ? "planCode-error" : undefined
                    }
                  >
                    <OpsSelectValue placeholder={copy.fields.planPlaceholder} />
                  </OpsSelectTrigger>
                  <OpsSelectContent>
                    {(plans ?? []).map((plan) => (
                      <OpsSelectItem key={plan.code} value={plan.code}>
                        <span className="flex items-center gap-2">
                          {formatPlanSelectLabel(plan)}
                          {plan.code === recommendedPlanCode ? (
                            <OpsBadge tone="accent">
                              {copy.fields.recommendedBadge}
                            </OpsBadge>
                          ) : null}
                        </span>
                      </OpsSelectItem>
                    ))}
                  </OpsSelectContent>
                </OpsSelect>
                {plansLoading ? (
                  <p className="text-[11px] ops-text-muted">
                    {copy.plansLoading}
                  </p>
                ) : !plans?.length ? (
                  <p className="text-[11px] ops-text-danger">{copy.plansEmpty}</p>
                ) : (
                  <p className="text-[11px] ops-text-muted">
                    {copy.hints.planOverride}
                  </p>
                )}
                <OpsFieldError
                  fieldId="planCode"
                  message={errors.planCode?.message}
                />
              </div>

              {selectedPlan ? (
                <div className="ops-rounded ops-hairline ops-bg-surface space-y-2 p-3">
                  <p className="text-xs font-medium ops-text">
                    {copy.planPreview.title}
                  </p>
                  <p className="text-sm font-semibold ops-text">
                    {selectedPlan.name}
                  </p>
                  <Row
                    label={copy.planPreview.price}
                    value={
                      isMotrizListPrice(selectedPlan)
                        ? copy.planPreview.pricePerMotriz(
                            formatPlanPriceCents(
                              selectedPlan.pricePerMotrizCents!,
                            ),
                          )
                        : formatPlanPriceCents(selectedPlan.monthlyPriceCents)
                    }
                  />
                  <Row
                    label={copy.planPreview.users}
                    value={formatPlatformLimitValue(selectedPlan.maxUsers)}
                  />
                  <Row
                    label={copy.planPreview.branches}
                    value={formatPlatformLimitValue(selectedPlan.maxBranches)}
                  />
                  <Row
                    label={copy.planPreview.stamps}
                    value={
                      isMotrizListPrice(selectedPlan)
                        ? copy.planPreview.stampsPerMotriz(
                            selectedPlan.stampsPerMotriz,
                          )
                        : copy.planPreview.stampsPerMonth(
                            selectedPlan.includedStamps,
                          )
                    }
                  />
                </div>
              ) : null}
            </OpsPanelBody>
          </OpsPanel>

          <OpsAlert title={copy.notice.title}>{copy.notice.description}</OpsAlert>

          <OpsFormErrors
            title={copy.validation.summaryTitle}
            messages={summaryErrors}
          />

          <div className="flex flex-wrap gap-2">
            <OpsButton
              type="button"
              variant="ghost"
              onClick={() => navigate("/platform/tenants")}
            >
              {copy.cancel}
            </OpsButton>
            <OpsButton
              type="submit"
              variant="primary"
              disabled={
                createMutation.isPending || plansLoading || !plans?.length
              }
            >
              {createMutation.isPending ? copy.submitting : copy.submit}
            </OpsButton>
          </div>
        </form>
      </div>
      <OpsUnsavedChangesDialog blocker={blocker} />
    </>
  );
}
