import { SettingsPageShell } from "@shared/ui/page-shells";
import { BillingSchemesCompactCard } from "../components/BillingSchemesCompactCard";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";

const copy = billingSchemesCopy.page;

export function BillingSchemesPage() {
  return (
    <SettingsPageShell
      sectionTitle={copy.title}
      title={copy.title}
      description={copy.description}
    >
      <BillingSchemesCompactCard />
    </SettingsPageShell>
  );
}
