/**
 * Dialog para armar un envío del periodo (elegir frecuencia + preview del corte).
 * Compartido por el workbench diario y la página de lotes.
 */

import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useBillingSchemes } from "@features/settings/application/hooks/useBillingSchemes";
import { formatBillingSchemeCadenceSummary } from "@features/settings/presentation/utils/formatBillingSchemeCadence";
import {
  useBillingDispatchPeriodPreview,
  useCreateBillingDispatchRun,
} from "@features/finance/application";
import {
  FINANCE_DISPATCH_DETAIL_PATH,
  FINANCE_DISPATCH_PATH,
  FINANCE_DISPATCH_PERIOD_PATH,
} from "../../application/financeRoutes";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { formatDispatchPeriodInclusiveCopy } from "../utils/formatDispatchPeriod";

const createCopy = dispatchRunsCopy.tab.createDialog;

interface FinanceDispatchCreateRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dónde está el CTA: lista de lotes vs workbench diario. */
  alreadyOpenSource?: "list" | "workbench";
  /** Cola a restaurar al volver del detalle. */
  returnTo?: string;
}

export function FinanceDispatchCreateRunDialog({
  open,
  onOpenChange,
  alreadyOpenSource = "workbench",
  returnTo,
}: FinanceDispatchCreateRunDialogProps) {
  const navigate = useNavigate();
  const alreadyOpenCopy = createCopy.alreadyOpen;
  const { data: schemes = [] } = useBillingSchemes({ isActive: true });
  const activeSchemes = useMemo(
    () => schemes.filter((scheme) => scheme.isActive),
    [schemes],
  );

  const [schemeId, setSchemeId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [alreadyOpenAlert, setAlreadyOpenAlert] = useState(false);

  const resolvedSchemeId =
    schemeId ||
    (activeSchemes.length === 1 ? activeSchemes[0]!.id : "");

  const selectedScheme = useMemo(
    () => activeSchemes.find((scheme) => scheme.id === resolvedSchemeId) ?? null,
    [activeSchemes, resolvedSchemeId],
  );

  const selectedSchemeCadenceSummary = selectedScheme
    ? formatBillingSchemeCadenceSummary(selectedScheme)
    : null;

  const previewQuery = useBillingDispatchPeriodPreview(
    open ? resolvedSchemeId || undefined : undefined,
  );
  const createMutation = useCreateBillingDispatchRun();

  const previewCopy = previewQuery.data
    ? formatDispatchPeriodInclusiveCopy(previewQuery.data)
    : null;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setCreateError(null);
        setSchemeId("");
      } else {
        setAlreadyOpenAlert(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleCreate = useCallback(async () => {
    if (!resolvedSchemeId) return;
    setCreateError(null);
    try {
      const { run, reused } = await createMutation.mutateAsync({
        billingSchemeId: resolvedSchemeId,
        autoPreview: true,
      });
      handleOpenChange(false);
      if (reused) {
        setAlreadyOpenAlert(true);
        return;
      }
      const from =
        returnTo ??
        (alreadyOpenSource === "list"
          ? FINANCE_DISPATCH_PERIOD_PATH
          : FINANCE_DISPATCH_PATH);
      navigate(FINANCE_DISPATCH_DETAIL_PATH(run.id), {
        replace: true,
        state: { from },
      });
    } catch {
      setCreateError(dispatchRunsCopy.toast.error);
    }
  }, [alreadyOpenSource, createMutation, handleOpenChange, navigate, resolvedSchemeId, returnTo]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{createCopy.title}</DialogTitle>
          <DialogDescription>{createCopy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dispatch-send-type">{createCopy.schemeLabel}</Label>
            <Select
              value={resolvedSchemeId}
              disabled={createMutation.isPending || activeSchemes.length === 0}
              onValueChange={setSchemeId}
            >
              <SelectTrigger id="dispatch-send-type">
                <SelectValue placeholder={createCopy.schemeLabel} />
              </SelectTrigger>
              <SelectContent>
                {activeSchemes.map((scheme) => (
                  <SelectItem key={scheme.id} value={scheme.id}>
                    {scheme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{createCopy.schemeHint}</p>
            {selectedSchemeCadenceSummary ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {createCopy.schemeSummaryLabel}:{" "}
                </span>
                {selectedSchemeCadenceSummary}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-sm font-medium">{createCopy.previewTitle}</p>
            {!resolvedSchemeId ? (
              <p className="text-sm text-muted-foreground">
                {createCopy.previewEmpty}
              </p>
            ) : previewQuery.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {createCopy.previewLoading}
              </p>
            ) : previewQuery.isError ? (
              <div className="space-y-2">
                <Alert variant="destructive">
                  <AlertDescription>{createCopy.previewError}</AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void previewQuery.refetch()}
                >
                  {createCopy.previewRetry}
                </Button>
              </div>
            ) : previewCopy ? (
              <p className="text-sm text-foreground">{previewCopy}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {createCopy.previewEmpty}
              </p>
            )}
          </div>

          {activeSchemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {createCopy.noSchemes}{" "}
              <Link
                to={FINANCE_DISPATCH_PERIOD_PATH}
                className="text-primary underline underline-offset-2"
              >
                {createCopy.settingsLink}
              </Link>
              .
            </p>
          ) : null}

          {createError ? (
            <Alert variant="destructive">
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={createMutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            {createCopy.cancel}
          </Button>
          <Button
            type="button"
            disabled={
              !resolvedSchemeId || createMutation.isPending || activeSchemes.length === 0
            }
            onClick={() => void handleCreate()}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {createCopy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <AlertDialog open={alreadyOpenAlert} onOpenChange={setAlreadyOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alreadyOpenCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alreadyOpenSource === "list"
                ? alreadyOpenCopy.bodyOnList
                : alreadyOpenCopy.bodyFromWorkbench}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{alreadyOpenCopy.dismiss}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
