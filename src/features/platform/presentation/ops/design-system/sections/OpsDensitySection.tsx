import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../../ui/OpsPanel";
import { OpsButton } from "../../ui/OpsButton";

export function OpsDensitySection() {
  return (
    <div className="space-y-4" data-testid="ops-ds-density">
      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Densidad / Espaciado</OpsPanelTitle>
          <OpsPanelDescription>
            Craft A · Primer denso: row 37, radius 3, hairline 1px antes que
            sombra. Ladder: flat → Panel (surface) → elevated (sheets/CmdK).
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          <dl className="ops-type-caption grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="ops-text-muted">--ops-row-h</dt>
              <dd className="ops-text">37px (tablas / listas)</dd>
            </div>
            <div>
              <dt className="ops-text-muted">Money row</dt>
              <dd className="ops-text">37px (= row-h)</dd>
            </div>
            <div>
              <dt className="ops-text-muted">--ops-radius</dt>
              <dd className="ops-text">3px (+2 dialog/cmdk)</dd>
            </div>
            <div>
              <dt className="ops-text-muted">Chrome</dt>
              <dd className="ops-text">topbar 42 · rail 168</dd>
            </div>
            <div>
              <dt className="ops-text-muted">Button / Input</dt>
              <dd className="ops-text">h 34 (sm 30) / h 36</dd>
            </div>
            <div>
              <dt className="ops-text-muted">Gaps toolbar</dt>
              <dd className="ops-text">0.5–0.75rem · labels 0.25rem</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <p className="ops-type-caption ops-text-muted">
              Elevación: flat hairline · Panel · elevated
            </p>
            <div
              className="ops-rounded ops-hairline ops-bg flex items-center px-3"
              style={{ height: "var(--ops-row-h)" }}
            >
              <span className="ops-type-caption">
                Flat — bg + hairline (listas / money)
              </span>
            </div>
            <div className="ops-panel">
              <div className="ops-panel-body ops-type-caption">
                Panel — surface + border (semáforos / KPI)
              </div>
            </div>
            <div className="ops-rounded ops-hairline ops-bg-elevated p-3 ops-type-caption">
              Elevated — sheets, dialog, CmdK
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OpsButton variant="solid">Solid 34</OpsButton>
            <OpsButton variant="outline">Outline</OpsButton>
            <OpsButton variant="ghost" size="sm">
              Ghost sm 30
            </OpsButton>
            <span
              className="ops-rounded ops-bg-accent inline-block"
              style={{
                width: "var(--ops-radius)",
                height: "var(--ops-radius)",
              }}
              title="radius 3px"
              aria-label="Muestra radius 3px"
            />
          </div>
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
