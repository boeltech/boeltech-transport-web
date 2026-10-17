/**
 * Sheet de purge: exige escribir PURGE_DEMO antes de POST :purge.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { toastError, toastSuccess } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";

import { usePurgeDemoSeed } from "../../application/hooks/useDemoSeed";
import { DEMO_PURGE_CONFIRM } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";

const copy = dashboardCopy.demoSeed;

export function DemoPurgeConfirmSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const purgeMutation = usePurgeDemoSeed();
  const busy = purgeMutation.isPending;
  const canSubmit = confirmText.trim() === DEMO_PURGE_CONFIRM && !busy;

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmText("");
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    purgeMutation.mutate(undefined, {
      onSuccess: () => {
        toastSuccess(copy.purgeSuccess);
        setConfirmText("");
        onOpenChange(false);
      },
      onError: (err) => {
        toastError(mapBackendError(err).message);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{copy.purgeSheetTitle}</SheetTitle>
          <SheetDescription>{copy.purgeSheetDescription}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Alert variant="destructive">
            <AlertDescription>{copy.bannerBody}</AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="demo-purge-confirm">{copy.purgeConfirmLabel}</Label>
            <Input
              id="demo-purge-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={copy.purgeConfirmPlaceholder}
              autoComplete="off"
              disabled={busy}
            />
          </div>
        </div>
        <SheetFooter className="mt-6 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {copy.purgeCancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit}
            onClick={handleConfirm}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {copy.purgeBusy}
              </>
            ) : (
              copy.purgeSubmit
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
