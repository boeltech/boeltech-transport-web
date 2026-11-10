import { Button } from "@shared/ui/button";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.bulkBar;

interface SettlementBulkBarProps {
  selectedCount: number;
  selectedTotal: number;
  /** Cuántos seleccionados sin CLABE (se registran en efectivo). */
  withoutClabeCount?: number;
  onDownloadReceipts?: () => void;
  onRegisterBatch?: () => void;
  /** F7 aún no cablea el Sheet; si falta, la primaria queda disabled con motivo. */
  registerDisabledReason?: string;
}

/**
 * Barra de lote oscura (pieza #9 · CA F4.5).
 * Con selección: primaria = Registrar N; Armar corte baja a outline en el header.
 */
export function SettlementBulkBar({
  selectedCount,
  selectedTotal,
  withoutClabeCount = 0,
  onDownloadReceipts,
  onRegisterBatch,
  registerDisabledReason,
}: SettlementBulkBarProps) {
  if (selectedCount <= 0) return null;

  const registerDisabled = Boolean(registerDisabledReason) || !onRegisterBatch;

  return (
    <div
      className="mb-2.5 flex flex-wrap items-center gap-3 rounded-xl bg-foreground px-3 py-2 text-sm text-background"
      data-testid="settlement-bulk-bar"
      role="status"
    >
      <span className="font-semibold">{copy.selected(selectedCount)}</span>
      <span className="font-mono tabular-nums">
        {formatMxCurrency(selectedTotal)}
      </span>
      {withoutClabeCount > 0 ? (
        <span className="opacity-70">
          {copy.cashNote(withoutClabeCount)}
        </span>
      ) : null}
      <span className="ml-auto flex flex-wrap items-center gap-2">
        {onDownloadReceipts ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDownloadReceipts}
          >
            {copy.downloadReceipts}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={registerDisabled}
          title={registerDisabledReason}
          onClick={onRegisterBatch}
        >
          {copy.register(selectedCount)}
        </Button>
      </span>
    </div>
  );
}
