import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../../ui/OpsPanel";

interface ColorRole {
  role: string;
  token: string;
  swatch: string;
  use: string;
  avoid: string;
}

const ROLES: readonly ColorRole[] = [
  {
    role: "bg",
    token: "--ops-bg",
    swatch: "var(--ops-bg)",
    use: "Canvas de página / shell",
    avoid: "Fondos white/cream ERP",
  },
  {
    role: "rail",
    token: "--ops-rail",
    swatch: "var(--ops-rail)",
    use: "Chrome lateral más oscuro",
    avoid: "Mezclar con surface de contenido",
  },
  {
    role: "elevated",
    token: "--ops-bg-elevated",
    swatch: "var(--ops-bg-elevated)",
    use: "Topbar, popovers, sheets, filas money base",
    avoid: "Canvas full-page sin sheet",
  },
  {
    role: "surface",
    token: "--ops-surface",
    swatch: "var(--ops-surface)",
    use: "Paneles, thead, chips idle",
    avoid: "Card blanca / soft teal",
  },
  {
    role: "border",
    token: "--ops-border",
    swatch: "var(--ops-border)",
    use: "Hairlines, inputs",
    avoid: "Borders brand purple / thick aesthetic",
  },
  {
    role: "fg",
    token: "--ops-fg",
    swatch: "var(--ops-fg)",
    use: "Texto primario",
    avoid: "Negro puro / teal wordmark ERP",
  },
  {
    role: "muted",
    token: "--ops-fg-muted",
    swatch: "var(--ops-fg-muted)",
    use: "Labels, secondary, thead",
    avoid: "Texto muted bajo AA",
  },
  {
    role: "accent",
    token: "--ops-accent",
    swatch: "var(--ops-accent)",
    use: "Azul acero · CTA primary, focus ring, nav/cola activa, chip active",
    avoid: "Igualar a --ops-fg (tinta≠acción); teal Patio; lavanda; sustituir danger",
  },
  {
    role: "ok",
    token: "--ops-ok",
    swatch: "var(--ops-ok)",
    use: "Lifecycle healthy / pago al corriente",
    avoid: "Success marketing genérico",
  },
  {
    role: "warn",
    token: "--ops-warn",
    swatch: "var(--ops-warn)",
    use: "Cobro pendiente (past_due), atención, vista previa de impacto",
    avoid: "Confundir con accent o con suspensión",
  },
  {
    role: "danger",
    token: "--ops-danger",
    swatch: "var(--ops-danger)",
    use: "Suspendido, cobro fallido, destructive, errores form",
    avoid: "Usar en mora operable (eso es warn)",
  },
  {
    role: "lime",
    token: "--ops-lime",
    swatch: "var(--ops-lime)",
    use: "Marca de instrumento (cupo). Hue distinto de ok",
    avoid: "Sustituto de accent u ok en sellos de etapa",
  },
  {
    role: "accent-fg",
    token: "--ops-accent-fg",
    swatch: "var(--ops-accent-fg)",
    use: "Texto sobre primary y sobre botón danger",
    avoid: "Texto de párrafo",
  },
  {
    role: "scrim",
    token: "--ops-scrim",
    swatch: "var(--ops-scrim)",
    use: "Backdrop de sheet y dialog",
    avoid: "Tinta de texto",
  },
  {
    role: "skeleton",
    token: "--ops-skeleton",
    swatch: "var(--ops-skeleton)",
    use: "Marca de carga. No es texto y no anima.",
    avoid: "Texto de interfaz o shimmer",
  },
] as const;

export function OpsColorSection() {
  return (
    <div className="space-y-4" data-testid="ops-ds-color">
      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Roles de color</OpsPanelTitle>
          <OpsPanelDescription>
            Pares light/dark «Mando acero» (neutros fríos hue ~250 · accent
            acero A). Semánticos solo estado. Dinero SaaS ≠ CFDI de patio. Sin
            Conform tlamx.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-2">
          {ROLES.map((row) => (
            <div
              key={row.token}
              className="ops-rounded ops-hairline grid gap-3 p-3 sm:grid-cols-[auto_1fr]"
            >
              <div
                className="ops-rounded h-12 w-12 shrink-0 ops-hairline"
                style={{ background: row.swatch }}
                aria-hidden
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="ops-type-title">{row.role}</span>
                  <code className="ops-type-caption ops-text-muted">
                    {row.token}
                  </code>
                </div>
                <p className="ops-type-caption">
                  <span className="ops-text-ok">Usar:</span>{" "}
                  <span className="ops-text">{row.use}</span>
                </p>
                <p className="ops-type-caption">
                  <span className="ops-text-danger">No usar:</span>{" "}
                  <span className="ops-text-muted">{row.avoid}</span>
                </p>
              </div>
            </div>
          ))}
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
