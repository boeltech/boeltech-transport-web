import { SettingsLayout } from "../components/SettingsLayout";
import { BillingSchemesMasterDetail } from "../components/BillingSchemesMasterDetail";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";

export function BillingSchemesPage() {
  const copy = billingSchemesCopy;

  return (
    <SettingsLayout sectionTitle={copy.page.title}>
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{copy.page.description}</p>
          <p className="text-sm text-muted-foreground">
            {copy.page.assignmentTip}{" "}
            <Button type="button" variant="link" className="h-auto p-0" asChild>
              <Link to="/clients">{copy.page.clientsCta}</Link>
            </Button>
          </p>
        </div>
        <BillingSchemesMasterDetail />
      </div>
    </SettingsLayout>
  );
}
