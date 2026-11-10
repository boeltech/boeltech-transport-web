import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import type { OperatorPaymentReadiness } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  formatOperatorSalaryLabel,
  formatOperatorTariffLabel,
  operatorPanelSubtitle,
} from "../utils/operatorPaymentDisplay";

const copy = settlementsCopy.operatorsList.panel;

type StepState = "ok" | "todo" | "warn";

function StepGlyph({ state, index }: { state: StepState; index: number }) {
  if (state === "ok") {
    return (
      <div
        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-success text-success-foreground"
        aria-hidden
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
        state === "todo"
          ? "bg-destructive text-destructive-foreground"
          : "bg-warning text-warning-foreground",
      )}
      aria-hidden
    >
      {index}
    </div>
  );
}

interface OperatorPaymentReadinessPanelProps {
  operator: OperatorPaymentReadiness | null;
  canAssign: boolean;
  onAssignTariff: (employeeId: string) => void;
}

export function OperatorPaymentReadinessPanel({
  operator,
  canAssign,
  onAssignTariff,
}: OperatorPaymentReadinessPanelProps) {
  if (!operator) {
    return (
      <aside
        className="rounded-xl border bg-card p-5"
        data-testid="operators-readiness-panel-empty"
      >
        <h2 className="text-base font-semibold">{copy.emptyTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.emptyDescription}</p>
      </aside>
    );
  }

  const tariff = formatOperatorTariffLabel(operator);
  const salary = formatOperatorSalaryLabel(operator);
  const employeeHref = `/employees/${operator.employeeId}`;
  const tariffState: StepState =
    operator.status === "no_template"
      ? "todo"
      : operator.status === "dual_template" ||
          operator.status === "version_superseded"
        ? "warn"
        : "ok";
  const salaryState: StepState = salary.amount ? "ok" : "warn";
  const accountState: StepState = operator.hasClabe ? "ok" : "todo";

  return (
    <aside className="space-y-3" data-testid="operators-readiness-panel">
      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold leading-6">{operator.fullName}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {operatorPanelSubtitle(operator)}
          </p>
        </div>
        <div className="flex flex-col gap-3.5 px-5 py-4">
          <div className="grid grid-cols-[28px_1fr] gap-3">
            <StepGlyph state={tariffState} index={1} />
            <div>
              <div className="text-sm font-semibold">{copy.stepTariff}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {tariff.muted ? copy.stepTariffEmpty : tariff.title}
                {tariff.subtitle ? ` · ${tariff.subtitle}` : ""}
              </div>
              {canAssign && tariffState !== "ok" ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  data-testid="operators-panel-assign"
                  onClick={() => onAssignTariff(operator.employeeId)}
                >
                  {settlementsCopy.operatorsList.assignSingle}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[28px_1fr] gap-3">
            <StepGlyph state={salaryState} index={2} />
            <div>
              <div className="text-sm font-semibold">{copy.stepSalary}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {salary.amount ? (
                  <>
                    {salary.amount}
                    {salary.period ? ` ${salary.period}` : ""}
                    {" · "}
                    <Link
                      to={employeeHref}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {copy.stepSalaryEdit}
                    </Link>
                  </>
                ) : (
                  <>
                    {copy.stepSalaryEmpty}{" "}
                    <Link
                      to={employeeHref}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {copy.stepSalaryEdit}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[28px_1fr] gap-3">
            <StepGlyph state={accountState} index={3} />
            <div>
              <div className="text-sm font-semibold">{copy.stepAccount}</div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {operator.hasClabe ? (
                  copy.stepAccountOk
                ) : (
                  <>
                    {copy.stepAccountMissing}{" "}
                    <Link
                      to={employeeHref}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                      data-testid="operators-panel-clabe-link"
                    >
                      {copy.stepAccountEdit}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {operator.status === "no_template" ? (
        <Alert variant="info" data-testid="operators-assign-info">
          <AlertTitle>{copy.assignInfoTitle}</AlertTitle>
          <AlertDescription>{copy.assignInfoDescription}</AlertDescription>
        </Alert>
      ) : null}
    </aside>
  );
}
