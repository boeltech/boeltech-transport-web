import { useMemo } from "react";
import { usePermissions } from "@shared/permissions";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import {
  getReportsCatalogItemsByGroup,
  REPORTS_HUB_PAGE_ICON,
} from "../config/reportsHubCatalog";
import { ReportsCatalogSection } from "../components/ReportsCatalogSection";
import { ReportsExportsSection } from "../components/ReportsExportsSection";
import { reportsCopy } from "../copy/reportsCopy";

const PageIcon = REPORTS_HUB_PAGE_ICON;

export function ReportsPage() {
  const { hasPermission } = usePermissions();

  const access = useMemo(
    () => ({
      canFinanceAnalytics: hasPermission("finance", "read"),
      canReadTrips: hasPermission("trips", "read"),
      canReadBranches: hasPermission("branches", "read"),
    }),
    [hasPermission],
  );

  const catalogGroups = useMemo(
    () => getReportsCatalogItemsByGroup(access),
    [access],
  );

  const canExportTrips = hasPermission("reports", "export");

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        icon: <PageIcon className="h-5 w-5" />,
        title: reportsCopy.page.title,
        subtitle: reportsCopy.page.description,
      }}
    >
      <div className="space-y-10">
        <ReportsCatalogSection
          title={reportsCopy.catalog.groups.financial.title}
          description={reportsCopy.catalog.groups.financial.description}
          items={catalogGroups.financial}
        />

        <ReportsCatalogSection
          title={reportsCopy.catalog.groups.operational.title}
          description={reportsCopy.catalog.groups.operational.description}
          items={catalogGroups.operational}
        />

        <ReportsExportsSection
          canExportTrips={canExportTrips}
          canFinanceAnalytics={access.canFinanceAnalytics}
        />
      </div>
    </DetailPageShell>
  );
}
