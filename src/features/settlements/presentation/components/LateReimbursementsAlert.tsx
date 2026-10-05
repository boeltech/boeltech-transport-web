import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementCreatePath, settlementDetailPath } from "../../application/settlementsRoutes";
import type { DriverSettlement } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { shouldShowLateReimbursementsAlert } from "../utils/reimbursementLines";
import { ReimbursementLinesTable } from "./ReimbursementLinesTable";

const copy = settlementsCopy.reimbursements;

export interface LateReimbursementsAlertProps {
  settlement: DriverSettlement;
  canCreate: boolean;
}

/** B.1 (E11 punto 10): gastos aprobados después de armar o autorizar este pago. */
export function LateReimbursementsAlert({ settlement, canCreate }: LateReimbursementsAlertProps) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const late = settlement.lateReimbursements;
  if (!late || !shouldShowLateReimbursementsAlert(settlement)) return null;

  const amount = formatMxCurrency(late.amount);
  const body =
    settlement.status === "approved" ? copy.lateAlert.approvedBody(amount) : copy.lateAlert.draftBody(amount);
  const goToReimbursementSettlement = () =>
    navigate(
      settlementCreatePath({
        kind: "reimbursements",
        employeeId: settlement.employeeId,
        from: settlement.id,
      }),
    );

  return (
    <>
      <Alert variant="info" data-testid="late-reimbursements-alert">
        <Info />
        <AlertTitle>{copy.lateAlert.title}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{body}</p>
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button type="button" size="sm" variant="outline" onClick={goToReimbursementSettlement}>
                {copy.createAction}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" onClick={() => setSheetOpen(true)}>
              {copy.lateAlert.viewExpenses}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
          onFocusOutside={(event) => event.preventDefault()}
          data-testid="late-reimbursements-sheet"
        >
          <SheetHeader className="shrink-0 border-b px-6 py-4">
            <SheetTitle>{copy.lateSheet.title}</SheetTitle>
            <SheetDescription>{copy.lateSheet.description}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {late.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{copy.lateSheet.empty}</p>
            ) : (
              <ReimbursementLinesTable
                lines={late.items}
                ariaLabel={copy.lateSheet.title}
                showTripLine={false}
                showTotal
                tripLinkFrom={settlementDetailPath(settlement.id)}
              />
            )}
          </div>
          {canCreate && late.items.length > 0 ? (
            <SheetFooter className="shrink-0 border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={goToReimbursementSettlement}>
                {copy.createAction}
              </Button>
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
