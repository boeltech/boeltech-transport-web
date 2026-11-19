/**
 * Tabs de listado Tarifas / Rutas — soft RouteTabsNav + count (NL6).
 * Sustituye el hand-roll con subrayado border-b-2.
 */

import { RouteTabsNav } from "@shared/ui/tabs";
import {
  COMPENSATION_CORRIDORS_HREF,
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
  tariffsCount,
  routesCount,
}: TariffListTabsProps) {
  return (
    <div className="mb-1" data-testid="tariff-list-tabs">
      <RouteTabsNav
        aria-label="Secciones de tarifas"
        items={[
          {
            id: "tariffs",
            to: COMPENSATION_TEMPLATES_PATH,
            label: copy.listTabTariffs,
            end: true,
            count: tariffsCount,
          },
          {
            id: "routes",
            to: COMPENSATION_CORRIDORS_HREF,
            label: copy.listTabRoutes,
            count: routesCount,
          },
        ]}
      />
    </div>
  );
}

/** Destino canónico de la pestaña Rutas (TEC C.2). */
export const TARIFF_ROUTES_TAB_HREF = COMPENSATION_CORRIDORS_HREF;

export { COMPENSATION_CORRIDORS_HREF };
