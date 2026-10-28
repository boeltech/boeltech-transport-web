import { cn } from "@shared/lib/utils/cn";
import { opsCopy } from "../opsCopy";
import { healthScoreTone } from "../opsStatusTones";
import type { OpsBadgeTone } from "../ui/OpsBadge";
import { OpsSectionRule } from "./OpsSectionRule";

export interface OpsHealthSignalLine {
  key: string;
  name: string;
  value: number;
  weightLabel: string;
}

export interface OpsHealthLedgerProps {
  score: number | null;
  /** Ya formateado. Null = todavía no hay refresh. */
  asOfLabel: string | null;
  pendingLabel: string;
  signals: readonly OpsHealthSignalLine[] | null;
}

const SCORE_CLASS: Record<OpsBadgeTone, string> = {
  ok: "ops-text-ok",
  warn: "ops-text-warn",
  danger: "ops-text-danger",
  accent: "ops-text",
  muted: "ops-text-muted",
  default: "ops-text-muted",
};

/**
 * Score que mandó el servidor. 40 riesgo y 70 vigilancia salen de
 * `healthScoreTone`. Las cinco señales no tienen color ni barra.
 */
export function OpsHealthLedger({
  score,
  asOfLabel,
  pendingLabel,
  signals,
}: OpsHealthLedgerProps) {
  const tone = healthScoreTone(score);
  const scoreText = score == null ? "—" : String(score);

  return (
    <div data-testid="ops-health-ledger">
      <OpsSectionRule
        label={opsCopy.ledger.rule}
        meta={asOfLabel ?? pendingLabel}
      />
      <p
        className={cn("ops-health-score", SCORE_CLASS[tone])}
        data-testid="ops-health-score"
        data-ops-health-tone={tone}
      >
        {scoreText}
      </p>
      {signals && signals.length > 0 ? (
        <ul className="ops-health-signals">
          {signals.map((signal) => (
            <li key={signal.key} className="ops-health-signal">
              <span className="ops-health-signal-name">{signal.name}</span>
              <span className="ops-health-signal-value">{signal.value}</span>
              <span className="ops-health-signal-weight">
                {signal.weightLabel}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
