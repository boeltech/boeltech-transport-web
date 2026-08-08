/**
 * Página pública `/activate-tenant?token=`.
 * Verify → accept (sin set-password) → CTA a `/login` con subdomain.
 * No escribe erp_platform_* ni emite sesión tenant (ADR-0073 / T5).
 */
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, Building2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { InfoRow } from "@shared/ui/data-display";
import { AuthFunnelFormHeader } from "@pages/auth/AuthFunnelFormHeader";
import { AuthFunnelStatusBlock } from "@pages/auth/AuthFunnelStatusBlock";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import { useVerifyTenantActivation } from "../../application/hooks/useVerifyTenantActivation";
import { tenantActivationsApi } from "../../infrastructure/tenantActivationsApi";
import { tenantActivationCopy } from "../copy/tenantActivationCopy";

type PageState = "loading" | "valid" | "invalid" | "success";

export function ActivateTenantPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const {
    isLoading: isVerifying,
    isMissingToken,
    isValid,
    data: verifyData,
    errorMessage: verifyErrorMessage,
  } = useVerifyTenantActivation(token);

  const [isSuccess, setIsSuccess] = useState(false);
  const [acceptedSubdomain, setAcceptedSubdomain] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageState: PageState = isSuccess
    ? "success"
    : isMissingToken || Boolean(verifyErrorMessage)
      ? "invalid"
      : isVerifying
        ? "loading"
        : isValid
          ? "valid"
          : "loading";

  const tokenError =
    verifyErrorMessage || "No se proporcionó un enlace válido";

  const handleAccept = async () => {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await tenantActivationsApi.accept({ token });
      setAcceptedSubdomain(result.data.subdomain);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(mapBackendError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <AuthFunnelStatusBlock
        variant="loading"
        loadingLabel={tenantActivationCopy.verifying}
      />
    );
  }

  if (pageState === "invalid") {
    return (
      <AuthFunnelStatusBlock
        variant="error"
        icon={<AlertCircle className="h-8 w-8" aria-hidden />}
        title={tenantActivationCopy.invalidTitle}
        description={tokenError}
      >
        <Button asChild variant="outline" size="lg" className="mt-4 w-full">
          <Link to="/login">{tenantActivationCopy.invalidCta}</Link>
        </Button>
      </AuthFunnelStatusBlock>
    );
  }

  if (pageState === "success") {
    const sub = acceptedSubdomain ?? verifyData?.subdomain ?? "";
    const loginSearch = sub
      ? `?subdomain=${encodeURIComponent(sub)}`
      : "";
    return (
      <AuthFunnelStatusBlock
        variant="success"
        icon={<CheckCircle className="h-8 w-8" aria-hidden />}
        title={tenantActivationCopy.successTitle}
        description={tenantActivationCopy.successDescription(sub)}
      >
        <Button asChild size="lg" className="mt-4 w-full">
          <Link to={{ pathname: "/login", search: loginSearch }}>
            {tenantActivationCopy.successCta}
          </Link>
        </Button>
      </AuthFunnelStatusBlock>
    );
  }

  return (
    <div className="w-full space-y-6">
      <AuthFunnelFormHeader
        title={tenantActivationCopy.validTitle}
        description={tenantActivationCopy.validDescription}
      />

      <div className="bg-muted/40 space-y-3 rounded-lg border p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
          <Building2 className="h-3.5 w-3.5" aria-hidden />
          {tenantActivationCopy.companyLabel}
        </div>
        <p className="text-base font-semibold">{verifyData?.companyName}</p>
        <InfoRow
          variant="inline"
          label={tenantActivationCopy.emailLabel}
          value={verifyData?.emailMasked ?? "—"}
        />
        <InfoRow
          variant="inline"
          label={tenantActivationCopy.subdomainLabel}
          value={verifyData?.subdomain ?? "—"}
        />
        {verifyData?.expiresAt ? (
          <InfoRow
            variant="inline"
            label={tenantActivationCopy.expiresLabel}
            value={formatDateTime(verifyData.expiresAt)}
          />
        ) : null}
      </div>

      <p className="text-muted-foreground text-sm">
        {tenantActivationCopy.passwordHint}
      </p>

      {error ? (
        <AlertWithIcon variant="destructive" title="No se pudo activar">
          {error}
        </AlertWithIcon>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        onClick={() => void handleAccept()}
      >
        {isSubmitting
          ? tenantActivationCopy.activating
          : tenantActivationCopy.activate}
      </Button>
    </div>
  );
}
