import {
  computeStampUsagePercent,
  resolveStampUsageAlertLevel,
  type StampUsageAlertLevel,
} from "@features/billing/presentation/utils/stampUsageThresholds";
import { opsCopy } from "../opsCopy";

type StampFill = "lime" | "ink" | "warn" | "danger";

export interface OpsQuotaStampsProps {
  kind: "stamps";
  label: string;
  used: number;
  included: number;
}

export interface OpsQuotaBranchesProps {
  kind: "branches";
  label: string;
  usage: number | null;
  granted: number | null;
  /** Tick danger solo si este flag ya viene en true. */
  overQuota: boolean;
}

export interface OpsQuotaHistoryProps {
  kind: "history";
  label: string;
  granted: number | null;
}

export type OpsQuotaLineProps =
  | OpsQuotaStampsProps
  | OpsQuotaBranchesProps
  | OpsQuotaHistoryProps;

function stampFill(level: StampUsageAlertLevel): StampFill {
  switch (level) {
    case "watch":
      return "ink";
    case "warning":
      return "warn";
    case "exhausted":
      return "danger";
    default:
      return "lime";
  }
}

function ratio(used: number, included: number): string {
  return `${used} / ${included}`;
}

/**
 * Cupo ya existente. Timbres usan 70/80/100 del paquete de billing.
 * Sucursales no inventan un porcentaje. Meses solo muestran el granted.
 */
export function OpsQuotaLine(props: OpsQuotaLineProps) {
  if (props.kind === "stamps") {
    const percent = computeStampUsagePercent(props.used, props.included);
    const level = resolveStampUsageAlertLevel(percent);
    const fill = stampFill(level);
    return (
      <div
        className="ops-quota-line"
        data-testid="ops-quota-line"
        data-ops-quota-kind="stamps"
        data-ops-tick={level === "exhausted" ? "danger" : undefined}
      >
        <span className="ops-quota-label">{props.label}</span>
        <span className="ops-quota-value">
          {ratio(props.used, props.included)}
        </span>
        <div className="ops-quota-track" aria-hidden>
          <div
            className="ops-quota-fill"
            data-ops-quota-fill={fill}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  if (props.kind === "branches") {
    const { usage, granted, overQuota, label } = props;
    const hasRatio = usage != null && granted != null;
    return (
      <div
        className="ops-quota-line"
        data-testid="ops-quota-line"
        data-ops-quota-kind="branches"
        data-ops-tick={overQuota ? "danger" : undefined}
      >
        <span className="ops-quota-label">{label}</span>
        <span className="ops-quota-value">
          {hasRatio ? ratio(usage, granted) : opsCopy.quota.unknown}
        </span>
      </div>
    );
  }

  return (
    <div
      className="ops-quota-line"
      data-testid="ops-quota-line"
      data-ops-quota-kind="history"
    >
      <span className="ops-quota-label">{props.label}</span>
      <span className="ops-quota-value">
        {props.granted == null ? opsCopy.quota.unknown : String(props.granted)}
      </span>
    </div>
  );
}
