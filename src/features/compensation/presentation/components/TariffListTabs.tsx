import { Link } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
} from "../../application/compensationRoutes";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.templates;

interface TariffListTabsProps {
  active: "tariffs" | "routes";
  tariffsCount?: number;
  routesCount?: number;
}

export function TariffListTabs({
  active,
  tariffsCount,
  routesCount,
}: TariffListTabsProps) {
  const tariffsLabel =
    typeof tariffsCount === "number"
      ? copy.tabs.tariffs(tariffsCount)
      : copy.listTabTariffs;
  const routesLabel =
    typeof routesCount === "number"
      ? copy.tabs.routes(routesCount)
      : copy.listTabRoutes;

  return (
    <div
      role="tablist"
      aria-label="Secciones de tarifas"
      className="mb-1 flex gap-1 border-b"
      data-testid="tariff-list-tabs"
    >
      <TabLink
        to={COMPENSATION_TEMPLATES_PATH}
        active={active === "tariffs"}
        label={tariffsLabel}
      />
      <TabLink
        to={COMPENSATION_CORRIDORS_PATH}
        active={active === "routes"}
        label={routesLabel}
      />
    </div>
  );
}

function TabLink({
  to,
  active,
  label,
}: {
  to: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      role="tab"
      aria-selected={active}
      to={to}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

/** Destino canónico de la pestaña Rutas (también sirve redirect desde hub). */
export const TARIFF_ROUTES_TAB_HREF = `${COMPENSATION_TEMPLATES_PATH}?tab=routes`;

/** Alias legacy corridors path still valid; prefer tab. */
export { COMPENSATION_CORRIDORS_PATH };
