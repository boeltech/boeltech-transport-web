import { Link } from "react-router-dom";
import { SettingsLayout } from "../components/SettingsLayout";
import { BillingServiceConceptMasterDetail } from "../components/BillingServiceConceptMasterDetail";
import { billingServiceConceptsCopy } from "../copy/billingServiceConceptsCopy";

export function BillingServiceConceptsPage() {
  return (
    <SettingsLayout sectionTitle={billingServiceConceptsCopy.page.title}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {billingServiceConceptsCopy.page.description}{" "}
          <Link
            to="/settings/billing"
            className="text-primary underline-offset-4 hover:underline"
          >
            {billingServiceConceptsCopy.page.backToBilling}
          </Link>
        </p>
        <BillingServiceConceptMasterDetail />
      </div>
    </SettingsLayout>
  );
}
