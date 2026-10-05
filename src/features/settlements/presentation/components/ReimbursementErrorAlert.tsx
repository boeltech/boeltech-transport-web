import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementDetailPath } from "../../application/settlementsRoutes";
import { SETTLEMENT_STATUS_LABELS } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import type { ReimbursementCreateError } from "../utils/settlementCreateConflicts";

const copy = settlementsCopy.reimbursements.errors;

export interface ReimbursementExpenseRef {
  readonly tripCode: string;
  readonly amount: number;
}

export interface ReimbursementErrorAlertProps {
  error: ReimbursementCreateError;
  /** Busca código de viaje y monto del gasto en las listas que ve el usuario. */
  findExpense: (tripExpenseId: string) => ReimbursementExpenseRef | undefined;
}

/** D13: 422/409 de reembolsos como `Alert` persistente en el resumen (nunca solo toast). */
export function ReimbursementErrorAlert({ error, findExpense }: ReimbursementErrorAlertProps) {
  let title: string;
  let body: ReactNode;

  switch (error.kind) {
    case "requires_expenses":
      title = copy.requiresExpensesTitle;
      body = <p>{copy.requiresExpensesBody}</p>;
      break;
    case "payee_not_trip_driver": {
      const expense = findExpense(error.tripExpenseId);
      title = expense
        ? copy.payeeNotDriverTitle(expense.tripCode)
        : copy.payeeNotDriverTitleFallback;
      body = <p>{copy.payeeNotDriverBody}</p>;
      break;
    }
    case "not_eligible": {
      const expense = findExpense(error.tripExpenseId);
      title = copy.notEligibleTitle;
      body = (
        <p>{expense ? copy.notEligibleBody(expense.tripCode) : copy.notEligibleBodyFallback}</p>
      );
      break;
    }
    case "expense_in_active_settlement":
      title = copy.inActiveSettlementTitle;
      body = (
        <>
          {error.conflicts.length > 0 ? (
            <ul className="space-y-1">
              {error.conflicts.map((conflict) => {
                const expense = findExpense(conflict.tripExpenseId);
                return (
                  <li key={`${conflict.tripExpenseId}-${conflict.settlementId}`}>
                    {copy.inActiveSettlementLinePrefix(
                      conflict.tripCode || expense?.tripCode || "—",
                      expense ? formatMxCurrency(expense.amount) : null,
                    )}
                    {conflict.settlementId ? (
                      <Link
                        to={settlementDetailPath(conflict.settlementId)}
                        className="font-medium underline underline-offset-2"
                      >
                        {conflict.settlementNumber}
                      </Link>
                    ) : (
                      conflict.settlementNumber
                    )}
                    {copy.inActiveSettlementLineStatus(
                      SETTLEMENT_STATUS_LABELS[conflict.status] ?? conflict.status,
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>{copy.inActiveSettlementFallback}</p>
          )}
          <p>{copy.inActiveSettlementHint}</p>
        </>
      );
      break;
  }

  return (
    <Alert variant="warning" data-testid="reimbursement-error-alert">
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">{body}</AlertDescription>
    </Alert>
  );
}
