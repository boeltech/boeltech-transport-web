/**
 * Sello digital de la empresa (CSD).
 *
 * Se guarda al instante contra POST /settings/billing/certificate, sin pasar
 * por el "Guardar cambios" del formulario. La tarjeta lo dice explícitamente
 * para que la diferencia no dependa de que el usuario la deduzca.
 */

import { memo, useCallback, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, FileKey, Loader2, Upload } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { FieldInlineError } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { InfoRow } from "@shared/ui/data-display";
import { formatDate } from "@shared/utils/dateUtils";

import { useUploadCertificate } from "../../application/hooks";
import type { BillingSettings } from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import type { CertificateReadiness } from "../utils/billingReadiness";
import { BILLING_ANCHORS } from "./BillingReadinessCard";

const copy = billingSettingsCopy.certificate;

export interface BillingCertificateCardProps {
  settings: BillingSettings;
  readiness: CertificateReadiness;
  /** Solo ROLES.ADMIN puede cargar o renovar el sello. */
  canUpload: boolean;
  /**
   * Explica por qué no aparece el formulario de carga. Se omite en modo
   * consulta, donde el aviso general de solo lectura ya lo cubre.
   */
  showRestrictionNotice: boolean;
}

export const BillingCertificateCard = memo(function BillingCertificateCard({
  settings,
  readiness,
  canUpload,
  showRestrictionNotice,
}: BillingCertificateCardProps) {
  const uploadMutation = useUploadCertificate();
  const [certificate, setCertificate] = useState<File | null>(null);
  const [privateKey, setPrivateKey] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    certificate?: string;
    privateKey?: string;
    password?: string;
  }>({});

  const handleUpload = useCallback(() => {
    if (!canUpload) return;

    const nextErrors: typeof fieldErrors = {};
    if (!certificate) {
      nextErrors.certificate = copy.validation.certificateRequired;
    } else if (!certificate.name.toLowerCase().endsWith(".cer")) {
      nextErrors.certificate = copy.validation.extensionCer;
    }
    if (!privateKey) {
      nextErrors.privateKey = copy.validation.privateKeyRequired;
    } else if (!privateKey.name.toLowerCase().endsWith(".key")) {
      nextErrors.privateKey = copy.validation.extensionKey;
    }
    if (!password.trim()) {
      nextErrors.password = copy.validation.passwordRequired;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !certificate || !privateKey) {
      return;
    }

    uploadMutation.mutate(
      { certificate, privateKey, password },
      {
        onSuccess: () => {
          setCertificate(null);
          setPrivateKey(null);
          setPassword("");
          setFieldErrors({});
        },
      },
    );
  }, [canUpload, certificate, privateKey, password, uploadMutation]);

  const isExpired = readiness.status === "pending" && Boolean(readiness.expiresAt);
  const isExpiring = readiness.status === "warning";

  return (
    <section
      id={BILLING_ANCHORS.certificate}
      className="scroll-mt-24 rounded-xl border bg-card text-card-foreground shadow-sm"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{copy.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.description}
            </p>
          </div>
          {settings.certificateConfigured ? (
            <Badge
              variant={isExpired ? "destructive" : isExpiring ? "warning" : "success"}
              tone="soft"
              className="shrink-0"
            >
              {isExpired || isExpiring ? (
                <AlertTriangle className="mr-1 h-3 w-3" />
              ) : (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              {isExpired
                ? copy.statusExpired
                : isExpiring
                  ? copy.statusExpiring
                  : copy.statusConfigured}
            </Badge>
          ) : null}
        </div>

        <InfoRow
          variant="inline"
          label={copy.expiryLabel}
          value={
            settings.certificateExpiry
              ? copy.expiryValue(formatDate(settings.certificateExpiry))
              : settings.certificateConfigured
                ? copy.statusConfigured
                : copy.expiryMissing
          }
          alert={isExpired ? "expired" : isExpiring ? "warning" : undefined}
        />

        {isExpired || isExpiring ? (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isExpired ? copy.expiredWarning : copy.expiringWarning}
            </AlertDescription>
          </Alert>
        ) : null}

        {canUpload ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <CertificateFileField
              inputId="certificate-file"
              label={copy.certificateFile}
              accept=".cer"
              icon={<Upload className="mr-2 h-4 w-4" />}
              fileName={certificate?.name}
              errorMessage={fieldErrors.certificate}
              onChange={(file) => {
                setCertificate(file);
                setFieldErrors((prev) => ({ ...prev, certificate: undefined }));
              }}
            />
            <CertificateFileField
              inputId="privatekey-file"
              label={copy.privateKeyFile}
              accept=".key"
              icon={<FileKey className="mr-2 h-4 w-4" />}
              fileName={privateKey?.name}
              errorMessage={fieldErrors.privateKey}
              onChange={(file) => {
                setPrivateKey(file);
                setFieldErrors((prev) => ({ ...prev, privateKey: undefined }));
              }}
            />

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="cert-password">{copy.password}</Label>
              <Input
                id="cert-password"
                type="password"
                autoComplete="off"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "cert-password-error" : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder={copy.passwordPlaceholder}
              />
              <FieldInlineError
                fieldId="cert-password"
                message={fieldErrors.password}
              />
            </div>

            <div className="sm:col-span-2">
              <Button
                type="button"
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploadMutation.isPending
                  ? copy.uploading
                  : settings.certificateConfigured
                    ? copy.replace
                    : copy.upload}
              </Button>
            </div>
          </div>
        ) : showRestrictionNotice ? (
          <Alert>
            <AlertTitle>{copy.restrictedTitle}</AlertTitle>
            <AlertDescription>{copy.restrictedDescription}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </section>
  );
});

// ============================================================================
// FILE FIELD
// ============================================================================

interface CertificateFileFieldProps {
  inputId: string;
  label: string;
  accept: string;
  icon: ReactNode;
  fileName?: string;
  errorMessage?: string;
  onChange: (file: File | null) => void;
}

function CertificateFileField({
  inputId,
  label,
  accept,
  icon,
  fileName,
  errorMessage,
  onChange,
}: CertificateFileFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div>
        <input
          type="file"
          accept={accept}
          id={inputId}
          className="sr-only"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? `${inputId}-error` : undefined}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <Button type="button" variant="outline" className="w-full justify-start" asChild>
          <label htmlFor={inputId} className="cursor-pointer">
            {icon}
            {fileName ?? copy.chooseFile}
          </label>
        </Button>
      </div>
      <FieldInlineError fieldId={inputId} message={errorMessage} />
    </div>
  );
}
