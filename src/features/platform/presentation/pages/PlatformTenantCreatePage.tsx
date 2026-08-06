import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { InfoRow } from "@shared/ui/data-display";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
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
} from "../utils/formatPlanLabel";
import { formatPlatformLimitValue } from "../utils/platformBillingFormatters";
import {
  DECLARED_FLEET_BANDS,
  DEFAULT_OPERATIONAL_PLAN_CODE,
  recommendOperationalPlanCode,
  type DeclaredFleetBand,
} from "../utils/recommendOperationalPlan";

const FLEET_BAND_NONE = "__none__";

export function PlatformTenantCreatePage() {
  const copy = platformCopy.tenants.create;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const { data: plans, isLoading: plansLoading } = usePlatformPlans();
  const planManuallyOverridden = useRef(false);
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
    formState: { errors, isSubmitted },
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
      toast({
        title: copy.success,
        variant: "success",
      });
      navigate(`/platform/tenants/${result.data.tenant.id}`);
    },
  });

  const handleFleetBandChange = (value: string) => {
    const band =
      value === FLEET_BAND_NONE ? null : (value as DeclaredFleetBand);
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
      toast({
        title: copy.passwordActions.copied,
        variant: "success",
      });
    } catch {
      toast({
        title: copy.passwordActions.copyError,
        variant: "destructive",
      });
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
      <FormPageShell
        isLoading
        header={{
          backHref: "/platform/tenants",
          backLabel: copy.back,
          icon: <Building2 className="h-5 w-5" />,
          title: copy.title,
          subtitle: copy.description,
        }}
      >
        {null}
      </FormPageShell>
    );
  }

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref: "/platform/tenants",
        backLabel: copy.back,
        icon: <Building2 className="h-5 w-5" />,
        title: copy.title,
        subtitle: copy.description,
      }}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          {errors.root?.message ? (
            <AlertWithIcon variant="destructive" title={copy.error}>
              {errors.root.message}
            </AlertWithIcon>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {copy.sections.company}
              </CardTitle>
              <CardDescription>{copy.sections.companyDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="companyName">
                  {copy.fields.companyName}{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="companyName"
                  autoComplete="organization"
                  {...register("companyName")}
                  {...getRegisterFieldErrorProps(
                    "companyName",
                    errors.companyName?.message,
                  )}
                />
                <FieldInlineError
                  fieldId="companyName"
                  message={errors.companyName?.message}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="subdomain">
                  {copy.fields.subdomain}{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="subdomain"
                  autoComplete="off"
                  spellCheck={false}
                  {...register("subdomain")}
                  {...getRegisterFieldErrorProps(
                    "subdomain",
                    errors.subdomain?.message,
                  )}
                />
                <p className="text-xs text-muted-foreground">{copy.hints.subdomain}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.hints.subdomainPreview(normalizedSubdomain)}
                </p>
                <FieldInlineError
                  fieldId="subdomain"
                  message={errors.subdomain?.message}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {copy.sections.admin}
              </CardTitle>
              <CardDescription>{copy.sections.adminDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="adminEmail">
                  {copy.fields.adminEmail}{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  autoComplete="off"
                  {...register("adminEmail")}
                  {...getRegisterFieldErrorProps(
                    "adminEmail",
                    errors.adminEmail?.message,
                  )}
                />
                <p className="text-xs text-muted-foreground">{copy.hints.adminEmail}</p>
                <FieldInlineError
                  fieldId="adminEmail"
                  message={errors.adminEmail?.message}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="adminPassword">
                  {copy.fields.adminPassword}{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <div className="flex min-w-0 flex-1 gap-2">
                    <Input
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label={
                        showPassword
                          ? copy.passwordActions.hide
                          : copy.passwordActions.show
                      }
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label={copy.passwordActions.copy}
                      disabled={!adminPasswordValue?.trim()}
                      onClick={() => void handleCopyPassword()}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 sm:self-start"
                    onClick={handleGeneratePassword}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {copy.passwordActions.generate}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {copy.hints.adminPassword}
                </p>
                <FieldInlineError
                  fieldId="adminPassword"
                  message={errors.adminPassword?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">
                  {copy.fields.adminFirstName}{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="adminFirstName"
                  autoComplete="given-name"
                  {...register("adminFirstName")}
                  {...getRegisterFieldErrorProps(
                    "adminFirstName",
                    errors.adminFirstName?.message,
                  )}
                />
                <FieldInlineError
                  fieldId="adminFirstName"
                  message={errors.adminFirstName?.message}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminLastName">
                  {copy.fields.adminLastName}{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Input
                  id="adminLastName"
                  autoComplete="family-name"
                  {...register("adminLastName")}
                  {...getRegisterFieldErrorProps(
                    "adminLastName",
                    errors.adminLastName?.message,
                  )}
                />
                <FieldInlineError
                  fieldId="adminLastName"
                  message={errors.adminLastName?.message}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {copy.sections.plan}
              </CardTitle>
              <CardDescription>{copy.sections.planDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="declaredFleetBand">{copy.fields.fleetBand}</Label>
                <Select
                  value={fleetSelectValue}
                  onValueChange={handleFleetBandChange}
                >
                  <SelectTrigger id="declaredFleetBand">
                    <SelectValue placeholder={copy.fields.fleetBandPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FLEET_BAND_NONE}>
                      {copy.fields.fleetBandNone}
                    </SelectItem>
                    {DECLARED_FLEET_BANDS.map((band) => (
                      <SelectItem key={band} value={band}>
                        {copy.fleetBands[band]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{copy.hints.fleetBand}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planCode">
                  {copy.fields.plan}{" "}
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </Label>
                <Select
                  value={planCodeValue}
                  onValueChange={handlePlanChange}
                  disabled={plansLoading || !plans?.length}
                >
                  <SelectTrigger
                    id="planCode"
                    error={Boolean(errors.planCode)}
                    aria-invalid={errors.planCode ? true : undefined}
                  >
                    <SelectValue placeholder={copy.fields.planPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {(plans ?? []).map((plan) => (
                      <SelectItem key={plan.code} value={plan.code}>
                        <span className="flex items-center gap-2">
                          {formatPlanSelectLabel(plan)}
                          {plan.code === recommendedPlanCode ? (
                            <Badge variant="secondary" className="text-[10px]">
                              {copy.fields.recommendedBadge}
                            </Badge>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {plansLoading ? (
                  <p className="text-xs text-muted-foreground">{copy.plansLoading}</p>
                ) : !plans?.length ? (
                  <p className="text-xs text-destructive">{copy.plansEmpty}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {copy.hints.planOverride}
                  </p>
                )}
                <FieldInlineError
                  fieldId="planCode"
                  message={errors.planCode?.message}
                />
              </div>

              {selectedPlan ? (
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm font-medium">{copy.planPreview.title}</p>
                  <p className="text-base font-semibold">{selectedPlan.name}</p>
                  <InfoRow
                    variant="inline"
                    label={copy.planPreview.price}
                    value={formatPlanPriceCents(selectedPlan.monthlyPriceCents)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.planPreview.users}
                    value={formatPlatformLimitValue(selectedPlan.maxUsers)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.planPreview.branches}
                    value={formatPlatformLimitValue(selectedPlan.maxBranches)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.planPreview.stamps}
                    value={copy.planPreview.stampsPerMonth(
                      selectedPlan.includedStamps,
                    )}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <AlertWithIcon variant="info" title={copy.notice.title}>
            {copy.notice.description}
          </AlertWithIcon>

          <FormValidationSummary
            title={copy.validation.summaryTitle}
            messages={summaryErrors}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/platform/tenants")}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending || plansLoading || !plans?.length
              }
            >
              {createMutation.isPending ? copy.submitting : copy.submit}
            </Button>
          </div>
        </form>
      </div>
    </FormPageShell>
  );
}
