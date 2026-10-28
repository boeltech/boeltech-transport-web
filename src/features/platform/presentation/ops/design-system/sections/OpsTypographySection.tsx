import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../../ui/OpsPanel";

const LEVELS = [
  {
    id: "h1",
    className: "ops-type-h1",
    alias: "ops-type-display",
    label: "H1 / display",
    spec: "25px / 600 / lh 1.2 / −0.01em",
    sample: "Boeltech Ops",
    note: "Page hero, login",
  },
  {
    id: "h2",
    className: "ops-type-h2",
    alias: "ops-type-title",
    label: "H2 / title",
    spec: "19px / 600 / lh 1.25",
    sample: "Hub · Cobranza SaaS",
    note: "Page + sheet titles",
  },
  {
    id: "h3",
    className: "ops-type-h3",
    alias: null,
    label: "H3",
    spec: "16px / 600 / lh 1.3",
    sample: "Semáforos · Capacidad",
    note: "Section / panel titles",
  },
  {
    id: "body",
    className: "ops-type-body",
    alias: null,
    label: "body",
    spec: "15px / 400 / lh 1.45",
    sample:
      "Torre de control: etapa, cobro y capacidad motriz en una sola vista.",
    note: "Default .platform-ops",
  },
  {
    id: "caption",
    className: "ops-type-caption",
    alias: null,
    label: "caption",
    spec: "12.5px / 500 / lh 1.35",
    sample: "Factura SaaS · no es CFDI de transporte",
    note: "Labels, thead, badges",
  },
  {
    id: "mono",
    className: "ops-font-mono ops-type-caption tabular-nums",
    alias: null,
    label: "mono",
    spec: "12.5px / 500 / Plex Mono / tabular-nums",
    sample: "12,400.00 MXN · XAXX010101000 · 2026-10-27 16:40",
    note: "Folio, identificador, hora",
  },
] as const;

export function OpsTypographySection() {
  return (
    <div className="space-y-4" data-testid="ops-ds-typography">
      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Escala tipográfica</OpsPanelTitle>
          <OpsPanelDescription>
            IBM Plex Sans (400 / 500 / 600) e IBM Plex Mono. Sin peso 700.
            Display solo en el título de la vista. Folio e identificadores en
            mono.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          {LEVELS.map((level) => (
            <div
              key={level.id}
              className="ops-rounded ops-hairline space-y-2 p-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <code className="ops-type-caption ops-text-accent">
                  .{level.className}
                </code>
                {level.alias ? (
                  <code className="ops-type-caption ops-text-muted">
                    = .{level.alias}
                  </code>
                ) : null}
                <span className="ops-type-caption ops-text-muted">
                  {level.spec}
                </span>
              </div>
              <p className="ops-type-caption ops-text-muted m-0">
                {level.label}
              </p>
              <p className={`${level.className} ops-text m-0`}>{level.sample}</p>
              <p className="ops-type-caption ops-text-muted m-0">{level.note}</p>
            </div>
          ))}
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
