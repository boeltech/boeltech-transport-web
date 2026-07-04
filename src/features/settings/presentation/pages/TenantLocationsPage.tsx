import { SettingsLayout } from "../components/SettingsLayout";
import { TenantLocationMasterDetail } from "../components/TenantLocationMasterDetail";
import { tenantLocationsCopy } from "../copy/tenantLocationsCopy";

export function TenantLocationsPage() {
  return (
    <SettingsLayout sectionTitle={tenantLocationsCopy.page.title}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {tenantLocationsCopy.page.description}
        </p>
        <TenantLocationMasterDetail />
      </div>
    </SettingsLayout>
  );
}
