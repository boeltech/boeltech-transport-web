import type { PlatformTenantHealth } from "../../domain/entities";
import { formatDateTime } from "@shared/utils/dateUtils";
import { platformCopy } from "../copy/platformCopy";
import { OpsHealthLedger } from "./patterns/OpsHealthLedger";
import { OpsPanel, OpsPanelBody } from "./ui/OpsPanel";

const SIGNAL_KEYS = [
  "fiscal",
  "payment",
  "adoption",
  "fleet",
  "engagement",
] as const;

interface OpsTenantHealthPanelProps {
  health: PlatformTenantHealth;
}

export function OpsTenantHealthPanel({ health }: OpsTenantHealthPanelProps) {
  const copy = platformCopy.health;
  const signals = health.signals
    ? SIGNAL_KEYS.map((key) => ({
        key,
        name: copy.signals[key],
        value: Math.round(health.signals?.[key] ?? 0),
        weightLabel: `${Math.round((health.weights[key] ?? 0) * 100)}%`,
      }))
    : null;

  return (
    <OpsPanel data-testid="ops-tenant-health">
      <OpsPanelBody>
        <OpsHealthLedger
          score={health.score}
          asOfLabel={
            health.asOf ? copy.asOf(formatDateTime(health.asOf)) : null
          }
          pendingLabel={copy.pending}
          signals={signals}
        />
      </OpsPanelBody>
    </OpsPanel>
  );
}
