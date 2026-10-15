/**
 * Landing /settings — hub por jobs (Oleada 1, decisión A).
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HubPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { usePermissions } from "@shared/permissions";
import {
  useBillingSettings,
  useCompanySettings,
} from "../../application/hooks";
import {
  SETTINGS_HUB_GROUPS,
  filterSettingsNavItemsByPermission,
  getSettingsNavItemsForGroup,
  type SettingsHubGroupId,
} from "../config/settingsHubGroups";
import { settingsHubCopy } from "../copy/settingsHubCopy";
import { buildSettingsHubReadiness } from "../utils/settingsHubReadiness";

const copy = settingsHubCopy;

export function SettingsHubPage() {
  const { hasPermission } = usePermissions();
  const canReadSettings = hasPermission("settings", "read");
  const canReadBillingSettings = hasPermission("settings", "read");

  const companyQuery = useCompanySettings({ enabled: canReadSettings });
  const billingQuery = useBillingSettings({ enabled: canReadBillingSettings });

  const readiness = useMemo(
    () =>
      buildSettingsHubReadiness({
        company: companyQuery.data,
        billing: billingQuery.data,
        canReadCompany: canReadSettings,
        canReadBilling: canReadBillingSettings,
      }),
    [
      companyQuery.data,
      billingQuery.data,
      canReadSettings,
      canReadBillingSettings,
    ],
  );

  const visibleGroups = useMemo(() => {
    return SETTINGS_HUB_GROUPS.map((group) => {
      const items = filterSettingsNavItemsByPermission(
        getSettingsNavItemsForGroup(group.id),
        hasPermission,
      );
      return { group, items };
    }).filter(({ items }) => items.length > 0);
  }, [hasPermission]);

  return (
    <HubPageShell
      title={copy.page.title}
      description={copy.page.description}
      orientation={copy.orientation}
      readiness={readiness.length > 0 ? readiness : undefined}
      readinessAriaLabel={copy.readiness.ariaLabel}
      guide={{
        title: copy.guide.title,
        steps: [...copy.guide.steps],
        defaultOpen: false,
        storageKey: copy.guide.storageKey,
      }}
    >
      <div className="space-y-10">
        {visibleGroups.map(({ group, items }) => (
          <SettingsHubGroupSection
            key={group.id}
            groupId={group.id}
            items={items}
          />
        ))}
      </div>
    </HubPageShell>
  );
}

function SettingsHubGroupSection({
  groupId,
  items,
}: {
  groupId: SettingsHubGroupId;
  items: ReturnType<typeof getSettingsNavItemsForGroup>;
}) {
  const groupCopy = copy.groups[groupId];

  return (
    <section className="space-y-4" aria-labelledby={`settings-hub-${groupId}`}>
      <div className="space-y-1">
        <h2
          id={`settings-hub-${groupId}`}
          className="text-lg font-semibold tracking-tight"
        >
          {groupCopy.title}
        </h2>
        <p className="text-sm text-muted-foreground">{groupCopy.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id} className="rounded-xl">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base leading-snug">
                    {item.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={item.path}>
                    {copy.openSection}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
