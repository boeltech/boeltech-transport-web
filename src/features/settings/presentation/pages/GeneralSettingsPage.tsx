/**
 * GeneralSettingsPage
 *
 * Ficha de la empresa: identidad, domicilio y contacto.
 * Lectura por defecto; la edición ocurre por bloque en sheets.
 */

import { memo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import { SettingsPageShell } from "@shared/ui/page-shells";
import { usePermissions } from "@shared/permissions";

import { useCompanySettings } from "../../application/hooks";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";
import { CompanyProfileView } from "../components/CompanyProfileView";
import { CompanyLogoMark } from "../components/CompanyLogoMark";
import { resolveCompanyLogoSrc } from "../components/companyLogoSrc";

const copy = generalSettingsCopy;

export const GeneralSettingsPage = memo(function GeneralSettingsPage() {
  const { data: settings, isLoading, isError } = useCompanySettings();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("settings", "update");

  // Estable durante la sesión: solo se usa si el API no expone `updatedAt`.
  const [logoFallbackVersion] = useState(() => Date.now());

  const logoSrc = resolveCompanyLogoSrc(
    settings?.logoUrl,
    settings?.updatedAt,
    logoFallbackVersion,
  );

  const title = settings
    ? (settings.tradeName?.trim() || settings.legalName)
    : copy.page.fallbackTitle;

  return (
    <SettingsPageShell
      sectionTitle={copy.page.sectionTitle}
      title={title}
      description={copy.page.description}
      headerSlot={settings ? <CompanyLogoMark src={logoSrc} /> : null}
    >
      {isLoading ? <CompanyProfileSkeleton /> : null}

      {isError || (!isLoading && !settings) ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{copy.state.loadErrorTitle}</AlertTitle>
          <AlertDescription>{copy.state.loadErrorDescription}</AlertDescription>
        </Alert>
      ) : null}

      {settings ? (
        <CompanyProfileView
          settings={settings}
          logoSrc={logoSrc}
          canEdit={canEdit}
        />
      ) : null}
    </SettingsPageShell>
  );
});

function CompanyProfileSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((card) => (
        <div key={card} className="space-y-4 rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
