import type { ReactNode } from "react";

export type OpsKpiTone = "default" | "warn" | "danger";

export interface OpsKpiCell {
  id: string;
  /** Caption superior muted (p. ej. «Mora abierta»). */
  label: string;
  /** Número / monto protagonista (≥28–32px vía CSS). */
  value: ReactNode;
  /** Caption inferior muted. */
  caption?: string;
  /** Solo estado: warn/danger. Default = tinta. */
  tone?: OpsKpiTone;
}

export interface OpsKpiStripProps {
  cells: readonly OpsKpiCell[];
  /** Etiqueta accesible del strip (default «Indicadores»). */
  "aria-label"?: string;
}

/**
 * Franja KPI Hoy (estructura C · M6): 4 celdas hairline, radio 3px,
 * número mono tabular. Semánticos solo en el valor cuando hay estado.
 */
export function OpsKpiStrip({
  cells,
  "aria-label": ariaLabel = "Indicadores",
}: OpsKpiStripProps) {
  return (
    <div
      className="ops-kpi-strip"
      role="group"
      aria-label={ariaLabel}
      data-testid="ops-kpi-strip"
    >
      {cells.map((cell) => {
        const tone = cell.tone === "default" ? undefined : cell.tone;
        return (
          <div
            key={cell.id}
            className="ops-kpi-cell"
            data-ops-kpi-cell={cell.id}
          >
            <p className="ops-kpi-label">{cell.label}</p>
            <p
              className="ops-kpi-value"
              data-tone={tone}
              data-testid={`ops-kpi-value-${cell.id}`}
            >
              {cell.value}
            </p>
            {cell.caption ? (
              <p className="ops-kpi-caption">{cell.caption}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
