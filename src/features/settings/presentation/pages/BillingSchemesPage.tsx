import { SettingsLayout } from "../components/SettingsLayout";
import { BillingSchemesMasterDetail } from "../components/BillingSchemesMasterDetail";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";

export function BillingSchemesPage() {
  return (
    <SettingsLayout sectionTitle={billingSchemesCopy.page.title}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {billingSchemesCopy.page.description}
        </p>
        <BillingSchemesMasterDetail />
      </div>
    </SettingsLayout>
  );
}
