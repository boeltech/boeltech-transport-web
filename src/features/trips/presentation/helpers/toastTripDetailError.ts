import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { buildOverlayErrorToastDescription } from "@shared/utils/overlayErrorFeedback";

const LONG_ERROR_CHARS = 120;

export type TripDetailToastFn = (options: {
  title: string;
  description?: string;
  variant?: "error" | "destructive" | "success";
  duration?: number;
}) => void;

export function showTripDetailErrorToast(
  toast: TripDetailToastFn,
  error: unknown,
  title: string,
  options?: {
    seeInlineCopy?: string;
    setInlineError?: (message: string) => void;
    variant?: "error" | "destructive";
  },
): void {
  const message = getErrorMessage(error);
  options?.setInlineError?.(message);
  const hasInlineOverlay = Boolean(options?.setInlineError);
  toast({
    title,
    description:
      hasInlineOverlay && options?.seeInlineCopy
        ? buildOverlayErrorToastDescription(message, options.seeInlineCopy)
        : message,
    variant: options?.variant ?? "destructive",
    duration: message.length > LONG_ERROR_CHARS ? 10_000 : undefined,
  });
}
