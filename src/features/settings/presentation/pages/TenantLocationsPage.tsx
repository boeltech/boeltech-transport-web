import { AlertWithIcon } from "@shared/ui/alert";
import { SettingsLayout } from "../components/SettingsLayout";
import { TenantLocationMasterDetail } from "../components/TenantLocationMasterDetail";
import { tenantLocationsCopy } from "../copy/tenantLocationsCopy";

const copy = tenantLocationsCopy;

export function TenantLocationsPage() {
  return (
    <SettingsLayout
      sectionTitle={copy.page.breadcrumb}
      title={copy.page.title}
      description={copy.page.description}
    >
      <div className="space-y-4">
        <AlertWithIcon variant="info" title={copy.guide.title}>
          <p>{copy.guide.use}</p>
          <p className="mt-2 font-medium">{copy.guide.notTitle}</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>{copy.guide.notClient}</li>
            <li>{copy.guide.notBranch}</li>
            <li>{copy.guide.notFiscal}</li>
            <li>{copy.guide.notStop}</li>
          </ul>
        </AlertWithIcon>
        <TenantLocationMasterDetail />
      </div>
    </SettingsLayout>
  );
}
