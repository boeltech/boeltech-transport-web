import { Link } from "react-router-dom";
import { SettingsPageShell } from "@shared/ui/page-shells";
import { BillingSchemesCompactCard } from "../components/BillingSchemesCompactCard";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";

const copy = billingSchemesCopy.page;

/**
 * Capa A — catálogo de frecuencias de envío (solo CRUD de cadencia).
 * El ritual Mandar vive en Correo del periodo; aquí no se embebe.
 */
export function BillingSchemesPage() {
  return (
    <SettingsPageShell
      sectionTitle={copy.title}
      title={copy.title}
      description={
        <>
          {copy.description}{" "}
          <Link
            to={copy.periodMailHref}
            className="text-primary underline-offset-4 hover:underline"
          >
            {copy.periodMailCta}
          </Link>
        </>
      }
    >
      <BillingSchemesCompactCard />
    </SettingsPageShell>
  );
}
