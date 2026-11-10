import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { FieldInlineError, RHFDateField } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  getTodayString,
  localInputToUtcIso,
} from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { roundCents } from "../../domain/settlementTotals";
import type { DriverSettlement } from "../../domain/entities";
import { useBatchDisburseSettlements } from "../../application/hooks";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  partitionSettlementsByClabe,
  sumNetAmount,
} from "../utils/settlementBatchOmit";

const copy = settlementsCopy.workbench.batchRegister;

const formSchema = z.object({
  disbursedAt: z.string().min(1, copy.disbursedAtRequired),
  disbursementReference: z.string().trim().min(1, copy.referenceRequired).max(100),
  sourceAccount: z.string().trim().max(120).optional(),
});

type FormValues = z.infer<typeof formSchema>;

/** Fecha calendario local → ISO con offset (hora local actual del día). */
function localDateToDisbursedAtIso(dateYmd: string): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return localInputToUtcIso(`${dateYmd}T${hh}:${mm}`);
}

function uniqueNames(
  settlements: readonly DriverSettlement[],
  pick: (s: DriverSettlement) => string | null | undefined,
): string {
  const names = new Set<string>();
  for (const s of settlements) {
    const name = pick(s)?.trim();
    if (name) names.add(name);
  }
  return [...names].join(", ");
}

function formatCashNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

function sessionParticipatedInActors(
  settlements: readonly DriverSettlement[],
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return settlements.some(
    (s) =>
      s.createdBy === userId ||
      s.submittedBy === userId ||
      s.approvedBy === userId,
  );
}

export type BatchRegisterActorAlertKind = "separation_ok" | "sole_responsible" | "none";

export function resolveBatchRegisterActorAlertKind(input: {
  settlements: readonly DriverSettlement[];
  userId: string | null | undefined;
  armers: string;
  approvers: string;
}): BatchRegisterActorAlertKind {
  if (!input.armers || !input.approvers) return "none";
  if (sessionParticipatedInActors(input.settlements, input.userId)) {
    return "sole_responsible";
  }
  return "separation_ok";
}

interface SettlementBatchRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlements: readonly DriverSettlement[];
  /** employeeId → hasClabe (HB-T5: solo boolean). */
  hasClabeByEmployeeId: ReadonlyMap<string, boolean>;
  /** Sesión actual para copy R5 (C23). */
  currentUserId?: string | null;
  onSuccess?: () => void;
}

/**
 * Pieza #13 · Sheet Registrar N pagos (~480).
 * Banamex checkbox oculto hasta F8. No escribe operational-cash-ledger.
 */
export function SettlementBatchRegisterSheet({
  open,
  onOpenChange,
  settlements,
  hasClabeByEmployeeId,
  currentUserId = null,
  onSuccess,
}: SettlementBatchRegisterSheetProps) {
  const { toast } = useToast();
  const mutation = useBatchDisburseSettlements();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disbursedAt: getTodayString(),
      disbursementReference: "",
      sourceAccount: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    reset({
      disbursedAt: getTodayString(),
      disbursementReference: "",
      sourceAccount: "",
    });
  }, [open, reset]);

  const { spei, cash } = useMemo(
    () => partitionSettlementsByClabe(settlements, hasClabeByEmployeeId),
    [settlements, hasClabeByEmployeeId],
  );
  const total = useMemo(
    () => roundCents(sumNetAmount(settlements)),
    [settlements],
  );
  const speiTotal = useMemo(() => roundCents(sumNetAmount(spei)), [spei]);
  const cashTotal = useMemo(() => roundCents(sumNetAmount(cash)), [cash]);
  const cashNames = useMemo(
    () => formatCashNames(cash.map((s) => s.employeeFullName)),
    [cash],
  );

  const armers = useMemo(
    () =>
      uniqueNames(
        settlements,
        (s) => s.submittedByName ?? s.createdByName,
      ),
    [settlements],
  );
  const approvers = useMemo(
    () => uniqueNames(settlements, (s) => s.approvedByName),
    [settlements],
  );
  const actorAlertKind = useMemo(
    () =>
      resolveBatchRegisterActorAlertKind({
        settlements,
        userId: currentUserId,
        armers,
        approvers,
      }),
    [approvers, armers, currentUserId, settlements],
  );

  const isPending = isSubmitting || mutation.isPending;
  const count = settlements.length;

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    const expectedRevisions: Record<string, string> = {};
    for (const s of settlements) {
      if (!s.approvalRevision) {
        setApiError(copy.emptyEligible);
        return;
      }
      expectedRevisions[s.id] = s.approvalRevision;
    }

    const source = data.sourceAccount?.trim();
    const notes = source ? `Cuenta origen: ${source}` : undefined;

    try {
      const result = await mutation.mutateAsync({
        settlementIds: settlements.map((s) => s.id),
        disbursementReference: data.disbursementReference.trim(),
        disbursedAt: localDateToDisbursedAtIso(data.disbursedAt),
        notes,
        // Sin disbursementMethod → API deriva SPEI/cash por hasClabe.
        expectedRevisions,
      });

      const processed = result.processed.length;
      const omitted = result.omitted.length;
      toast({
        title:
          omitted > 0
            ? copy.successPartial(processed, omitted)
            : copy.successTitle(processed),
        description:
          omitted > 0
            ? result.omitted.map((o) => o.reason).slice(0, 3).join("; ")
            : undefined,
        variant: "success",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      toast({
        title: copy.errorTitle,
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col sm:max-w-[480px]"
        data-testid="settlement-batch-register-sheet"
      >
        <SheetHeader>
          <SheetTitle>{copy.title(count)}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <form
          className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFDateField
              control={control}
              name="disbursedAt"
              label={copy.disbursedAtLabel}
              fieldId="batch-disbursed-at"
              required
            />
            <div className="space-y-2">
              <Label htmlFor="batch-reference">{copy.referenceLabel}</Label>
              <Input
                id="batch-reference"
                placeholder={copy.referencePlaceholder}
                aria-invalid={Boolean(errors.disbursementReference)}
                {...register("disbursementReference")}
              />
              {errors.disbursementReference ? (
                <FieldInlineError
                  fieldId="batch-reference"
                  message={
                    errors.disbursementReference.message ?? copy.referenceRequired
                  }
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch-source-account">{copy.sourceAccountLabel}</Label>
            <Input
              id="batch-source-account"
              placeholder={copy.sourceAccountPlaceholder}
              {...register("sourceAccount")}
            />
            <p className="text-xs text-muted-foreground">{copy.sourceAccountHint}</p>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.howPaidLabel}
            </div>
            <div className="flex flex-col gap-1.5">
              {spei.length > 0 ? (
                <div
                  className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm"
                  data-testid="batch-register-spei"
                >
                  <span>
                    <span className="font-semibold">{copy.speiLabel(spei.length)}</span>
                    <div className="text-xs text-muted-foreground">{copy.speiHint}</div>
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatMxCurrency(speiTotal)}
                  </span>
                </div>
              ) : null}
              {cash.length > 0 ? (
                <div
                  className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm"
                  data-testid="batch-register-cash"
                >
                  <span>
                    <span className="font-semibold">{copy.cashLabel(cash.length)}</span>
                    <div className="text-xs text-muted-foreground">
                      {cash.length === 1
                        ? copy.cashHint(cashNames)
                        : copy.cashHintPlural(cashNames)}
                      {cash[0] ? (
                        <>
                          {" · "}
                          <Link
                            to={`/employees/${cash[0].employeeId}`}
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {copy.captureClabe}
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatMxCurrency(cashTotal)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* F8: casilla Banamex oculta hasta Q1 / SETTLEMENT_BANAMEX_DISPERSION_ENABLED */}

          {actorAlertKind === "separation_ok" ? (
            <Alert data-testid="batch-register-actor-alert">
              <AlertTitle>{copy.canRegisterAlertTitle}</AlertTitle>
              <AlertDescription>
                {copy.canRegisterAlertBody(armers, approvers)}
              </AlertDescription>
            </Alert>
          ) : null}
          {actorAlertKind === "sole_responsible" ? (
            <Alert data-testid="batch-register-actor-alert">
              <AlertTitle>{copy.soleResponsibleAlertTitle}</AlertTitle>
              <AlertDescription>{copy.soleResponsibleAlertBody}</AlertDescription>
            </Alert>
          ) : null}

          {apiError ? (
            <Alert variant="destructive">
              <AlertTitle>{copy.errorTitle}</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-auto flex items-baseline justify-between border-t border-foreground pt-3">
            <span className="font-semibold">{copy.totalLabel}</span>
            <span className="font-mono text-xl font-semibold tabular-nums">
              {formatMxCurrency(total)}
            </span>
          </div>

          <SheetFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || count === 0}
              data-testid="batch-register-submit"
            >
              {isPending ? copy.pending : copy.confirm(count)}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
