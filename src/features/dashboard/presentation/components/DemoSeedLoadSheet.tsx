/**
 * Confirmación antes de POST /setup/demo-seed.
 */

import { Loader2 } from "lucide-react";

import { useAuth } from "@/features/auth";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
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

import { useApplyDemoSeed } from "../../application/hooks/useDemoSeed";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  clearDemoDataBannerDismissed,
  getDemoDataBannerStorageKey,
} from "./DemoDataBanner";

const copy = dashboardCopy.demoSeed;

export function DemoSeedLoadSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const applyMutation = useApplyDemoSeed();
  const busy = applyMutation.isPending;

  const handleConfirm = () => {
    applyMutation.mutate(undefined, {
      onSuccess: () => {
        const tenantId = user?.tenant?.id;
        const userId = user?.id;
        if (tenantId && userId) {
          clearDemoDataBannerDismissed(
            getDemoDataBannerStorageKey(tenantId, userId),
          );
        }
        toastSuccess(copy.loadSuccess);
        onOpenChange(false);
      },
      onError: (err) => {
        toastError(mapBackendError(err).message);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{copy.loadSheetTitle}</SheetTitle>
          <SheetDescription>{copy.loadSheetDescription}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Alert variant="warning">
            <AlertDescription>{copy.offerBody}</AlertDescription>
          </Alert>
        </div>
        <SheetFooter className="mt-6 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {copy.loadCancel}
          </Button>
          <Button type="button" disabled={busy} onClick={handleConfirm}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {copy.loadBusy}
              </>
            ) : (
              copy.loadConfirm
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
