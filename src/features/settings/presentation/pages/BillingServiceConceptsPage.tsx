import { Link } from "react-router-dom";
import { SettingsPageShell } from "@shared/ui/page-shells";
import { BillingServiceConceptMasterDetail } from "../components/BillingServiceConceptMasterDetail";
import { billingServiceConceptsCopy } from "../copy/billingServiceConceptsCopy";

export function BillingServiceConceptsPage() {
  const { page } = billingServiceConceptsCopy;
  return (
    <SettingsPageShell
      sectionTitle={page.title}
      title={page.title}
      description={
        <>
          {page.description}{" "}
          <Link
            to="/settings/billing"
            className="text-primary underline-offset-4 hover:underline"
          >
            {page.backToBilling}
          </Link>
        </>
      }
    >
      <BillingServiceConceptMasterDetail />
    </SettingsPageShell>
  );
}
