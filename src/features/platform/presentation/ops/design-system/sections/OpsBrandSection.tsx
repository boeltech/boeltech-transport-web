import { OpsMoneyAmount, OpsSectionRule } from "../../patterns";
import { opsCopy } from "../../opsCopy";
import { OpsBadge } from "../../ui/OpsBadge";
import { OpsBrandMark } from "../../ui/OpsBrandMark";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../../ui/OpsPanel";

interface MotifRow {
  id: string;
  name: string;
  yes: string;
  no: string;
}

const MOTIFS: readonly MotifRow[] = [
  {
    id: "m1",
    name: "M1 · Regla de sección",
    yes: "Hoy, Hub, encabezados de bloque Operate",
    no: "Grid de 4 KPI cards, headers marketing",
  },
  {
    id: "m2",
    name: "M2 · Tick 3 px",
    yes: "Filas / sheets warn o danger",
    no: "Decorar ok, muted o accent",
  },
  {
    id: "m3",
    name: "M3 · Folio (montos)",
    yes: "Tablas Money / AR · IDs mono",
    no: "Números decorativos o con `$` + MXN",
  },
  {
    id: "m4",
    name: "M4 · Wordmark + monograma",
    yes: "Rail, login (`boeltech/ops` · `b/`)",
    no: "Shield lucide, badge «Ops», marca ERP",
  },
  {
    id: "m5",
    name: "M5 · Contadores de cola",
    yes: "Hoy — display mono en chips de cola (bajo el KPI strip)",
    no: "Sustituto del KPI strip; semáforos Hub",
  },
  {
    id: "m6",
    name: "M6 · KPI strip",
    yes: "Hoy — 4 celdas (mora $, suspendidos, activación, trial); número ≥28–32px",
    no: "Cards con sombra; sparklines en ancla; radio ≠ 3 px; lavanda",
  },
] as const;

/**
 * Marca Ops (LID-D8 / M4) + motivos M1–M6 con usos sí/no (Mando acero).
 */
export function OpsBrandSection() {
  return (
    <div className="space-y-4" data-testid="ops-ds-brand">
      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Wordmark y monograma</OpsPanelTitle>
          <OpsPanelDescription>
            LID-D8 — sin Shield ni badge «Ops». Acento = azul acero (≠ tinta,
            ≠ Tlamx, ≠ lavanda).
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="flex flex-wrap items-end gap-8">
          <div className="space-y-2">
            <p className="ops-type-caption ops-text-muted">Rail</p>
            <OpsBrandMark showEnv />
          </div>
          <div className="space-y-2">
            <p className="ops-type-caption ops-text-muted">Hero (login)</p>
            <OpsBrandMark size="hero" />
          </div>
          <div className="space-y-1">
            <p className="ops-type-caption ops-text-muted">Literales</p>
            <p className="ops-font-mono ops-type-body ops-text m-0">
              {opsCopy.wordmark}
            </p>
            <p className="ops-font-mono ops-type-body ops-text-muted m-0">
              {opsCopy.monogram}
            </p>
          </div>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Motivos M1–M6</OpsPanelTitle>
          <OpsPanelDescription>
            Usos sí / no — dirección «Mando acero» (M1–M6).
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          {MOTIFS.map((motif) => (
            <div
              key={motif.id}
              className="ops-rounded ops-hairline space-y-2 p-3"
              data-testid={`ops-ds-motif-${motif.id}`}
            >
              <p className="ops-type-caption ops-text m-0 font-semibold">
                {motif.name}
              </p>
              <div className="flex flex-wrap gap-2">
                <OpsBadge tone="ok">Sí · {motif.yes}</OpsBadge>
                <OpsBadge tone="muted">No · {motif.no}</OpsBadge>
              </div>
            </div>
          ))}
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Muestras vivas</OpsPanelTitle>
          <OpsPanelDescription>
            M1 + M3 en contexto — sin inventar look aparte del kit.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <OpsSectionRule label="Cobranza" meta="stub" />
          <div
            className="ops-rounded ops-hairline flex items-center justify-between gap-3 p-3"
            data-ops-tick="warn"
          >
            <span className="ops-font-mono ops-type-caption ops-text">
              INV-2026-09
            </span>
            <OpsMoneyAmount cents={1240000} />
          </div>
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
