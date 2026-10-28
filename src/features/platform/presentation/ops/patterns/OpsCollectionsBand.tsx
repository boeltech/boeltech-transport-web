import type { ReactNode } from "react";
import { OpsMoneyAmount } from "./OpsMoneyTable";

export interface OpsCollectionsBucket {
  id: string;
  label: string;
  cents: number;
  /** Danger y tick solo aquí. El resto de la banda queda en tinta. */
  overdue?: boolean;
}

export interface OpsCollectionsBandProps {
  buckets: OpsCollectionsBucket[];
  /** Una acción a la derecha. Lectura («Ver en Cobros») cabe para support. */
  action?: ReactNode;
}

/**
 * Antigüedad de cobro en una fila mono. No es una tabla de facturas.
 */
export function OpsCollectionsBand({ buckets, action }: OpsCollectionsBandProps) {
  if (buckets.length === 0) {
    return (
      <p
        className="ops-collections-empty ops-type-caption ops-text-muted"
        data-testid="ops-collections-band"
      >
        Sin saldo
      </p>
    );
  }

  return (
    <div className="ops-collections-band" data-testid="ops-collections-band">
      {buckets.map((bucket) => (
        <div
          key={bucket.id}
          className="ops-collections-bucket"
          data-ops-collections-bucket={bucket.id}
          data-overdue={bucket.overdue ? "true" : "false"}
        >
          <span className="ops-collections-label">{bucket.label}</span>
          <OpsMoneyAmount cents={bucket.cents} />
        </div>
      ))}
      {action ? <div className="ops-collections-action">{action}</div> : null}
    </div>
  );
}
