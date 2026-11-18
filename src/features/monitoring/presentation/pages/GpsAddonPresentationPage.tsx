/**
 * Página de presentación — Monitoreo GPS (DC4 · ancla GPS-Admin / GPS-Equipo).
 * CTA mailto solo con billing.update; equipo ve «Pide a un administrador».
 */

import { Bell, History, MapPin, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@features/auth";
import { buildGpsActivationMailto } from "@features/billing";
import { useCompanySettings } from "@features/settings";
import { usePermissions } from "@shared/permissions";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { EntitlementBadge } from "@shared/ui/entitlement-badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import { monitoringCopy } from "../copy/monitoringCopy";

const SUBSCRIPTION_PATH = "/settings/subscription";

export function GpsAddonPresentationPage() {
  const copy = monitoringCopy.presentation;
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canRequest = hasPermission("billing", "update");

  const companyQuery = useCompanySettings({
    enabled: canRequest,
  });

  const companyName = user?.getTenantName() ?? "Empresa";
  const userName = user?.getFullName() ?? "Usuario";
  const userEmail = user?.email ?? "";
  const rfc = companyQuery.data?.rfc ?? null;

  const mailtoHref = canRequest
    ? buildGpsActivationMailto({
        companyName,
        rfc,
        userName,
        userEmail,
      })
    : null;

  const includes = [
    {
      key: "fleetMap",
      icon: MapPin,
      title: copy.includes.fleetMap.title,
      body: copy.includes.fleetMap.body,
    },
    {
      key: "history",
      icon: History,
      title: copy.includes.history.title,
      body: copy.includes.history.body,
    },
    {
      key: "alerts",
      icon: Bell,
      title: copy.includes.alerts.title,
      body: copy.includes.alerts.body,
    },
  ] as const;

  const steps = [
    copy.how.step1,
    copy.how.step2,
    copy.how.step3,
  ] as const;

  return (
    <div
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 pb-12 sm:px-6"
      data-testid="gps-addon-presentation"
    >
      <Card>
        <CardContent className="grid gap-8 p-6 md:grid-cols-[1fr_minmax(0,22rem)] md:items-center md:p-7">
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <EntitlementBadge variant="kind">{copy.badgeType}</EntitlementBadge>
              <span className="text-sm text-muted-foreground">
                {copy.badgeNotIncluded}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
            <p className="text-[15px] leading-6 text-muted-foreground">
              {copy.lead}
            </p>

            {canRequest && mailtoHref ? (
              <div className="mt-1.5 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <a
                      href={mailtoHref}
                      data-testid="gps-addon-request-activation"
                    >
                      {copy.ctaRequest}
                    </a>
                  </Button>
                  <Link
                    to={SUBSCRIPTION_PATH}
                    className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    data-testid="gps-addon-view-complements"
                  >
                    {copy.ctaSecondary}
                  </Link>
                </div>
                <p className="text-xs leading-[18px] text-muted-foreground">
                  {copy.mailtoHint}
                </p>
              </div>
            ) : (
              <Alert variant="info" className="mt-1.5" data-testid="gps-addon-ask-admin">
                <Radio className="h-4 w-4" aria-hidden />
                <AlertTitle>{copy.askAdminTitle}</AlertTitle>
                <AlertDescription>{copy.askAdminBody}</AlertDescription>
              </Alert>
            )}
          </div>

          <FleetPreviewIllustration />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3" aria-labelledby="gps-includes-heading">
        <h2 id="gps-includes-heading" className="text-base font-semibold">
          {copy.includesTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {includes.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key}>
                <CardContent className="flex flex-col gap-2 p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <h2 className="text-base font-semibold">{copy.howTitle}</h2>
          <ol className="grid gap-5 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    "bg-primary text-xs font-semibold text-primary-foreground",
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

/** Esquema decorativo «Vista de ejemplo» (artboard ancla); no es el mapa real. */
function FleetPreviewIllustration() {
  return (
    <div
      className="relative min-h-[220px] overflow-hidden rounded-xl border bg-muted/40"
      role="img"
      aria-label="Vista de ejemplo del mapa de flota con tres unidades"
    >
      <div className="absolute inset-x-0 top-[150px] h-1.5 bg-border/80" />
      <div className="absolute inset-y-0 left-[62%] w-1.5 bg-border/80" />
      <div className="absolute left-[48%] right-0 top-[70px] h-1 bg-border/60" />
      <span className="absolute left-[72%] top-[144px] h-3 w-3 rounded-full bg-success" />
      <span className="absolute left-[58%] top-[210px] h-3 w-3 rounded-full bg-warning" />
      <span className="absolute left-[78%] top-[64px] h-3 w-3 rounded-full bg-neutral" />
      <div className="absolute bottom-3 left-3 right-3 rounded-lg border bg-card/95 p-3 shadow-sm">
        <p className="text-[11px] font-semibold text-muted-foreground">
          Flota · 3 unidades
        </p>
        <ul className="mt-2 space-y-1.5 text-xs">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
            <span className="font-mono">T-104</span>
            <span className="text-muted-foreground">En movimiento</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning" aria-hidden />
            <span className="font-mono">T-087</span>
            <span className="text-muted-foreground">Detenida</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neutral" aria-hidden />
            <span className="font-mono">T-121</span>
            <span className="text-muted-foreground">Sin señal</span>
          </li>
        </ul>
      </div>
      <span className="absolute right-2 top-2 rounded-md border bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Vista de ejemplo
      </span>
    </div>
  );
}
