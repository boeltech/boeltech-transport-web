import { Button } from "@shared/ui/button";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.bulkBar;

export type SettlementBulkBarMode = "payable" | "approval";

interface SettlementBulkBarProps {
  selectedCount: number;
  selectedTotal: number;
  mode?: SettlementBulkBarMode;
  /** Cuántos seleccionados sin CLABE (se registran en efectivo). Solo payable. */
  withoutClabeCount?: number;
  onDownloadReceipts?: () => void;
  onRegisterBatch?: () => void;
  onApproveBatch?: () => void;
  onRejectBatch?: () => void;
  registerDisabledReason?: string;
  approveDisabledReason?: string;
  rejectDisabledReason?: string;
  isBusy?: boolean;
}

/**
 * Barra de lote oscura (pieza #9 · CA F4.5 / F7).
 * - payable: Registrar N (+ Descargar recibos)
 * - approval: Autorizar N / Rechazar (R5/R6)
 */
export function SettlementBulkBar({
  selectedCount,
  selectedTotal,
  mode = "payable",
  withoutClabeCount = 0,
  onDownloadReceipts,
  onRegisterBatch,
  onApproveBatch,
  onRejectBatch,
  registerDisabledReason,
  approveDisabledReason,
  rejectDisabledReason,
  isBusy = false,
}: SettlementBulkBarProps) {
  if (selectedCount <= 0) return null;

  const isApproval = mode === "approval";
  const registerDisabled =
    Boolean(registerDisabledReason) || !onRegisterBatch || isBusy;
  const approveDisabled =
    Boolean(approveDisabledReason) || !onApproveBatch || isBusy;
  const rejectDisabled =
    Boolean(rejectDisabledReason) || !onRejectBatch || isBusy;

  return (
    <div
      className="mb-2.5 flex flex-wrap items-center gap-3 rounded-xl bg-foreground px-3 py-2 text-sm text-background"
      data-testid="settlement-bulk-bar"
      data-mode={mode}
      role="status"
    >
      <span className="font-semibold">{copy.selected(selectedCount)}</span>
      <span className="font-mono tabular-nums">
        {formatMxCurrency(selectedTotal)}
      </span>
      {!isApproval && withoutClabeCount > 0 ? (
        <span className="opacity-70">{copy.cashNote(withoutClabeCount)}</span>
      ) : null}
      <span className="ml-auto flex flex-wrap items-center gap-2">
        {isApproval ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={rejectDisabled}
              title={rejectDisabledReason}
              onClick={onRejectBatch}
              data-testid="settlement-bulk-reject"
            >
              {copy.reject}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={approveDisabled}
              title={approveDisabledReason}
              onClick={onApproveBatch}
              data-testid="settlement-bulk-approve"
            >
              {copy.approve(selectedCount)}
            </Button>
          </>
        ) : (
          <>
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
              data-testid="settlement-bulk-register"
            >
              {copy.register(selectedCount)}
            </Button>
          </>
        )}
      </span>
    </div>
  );
}
