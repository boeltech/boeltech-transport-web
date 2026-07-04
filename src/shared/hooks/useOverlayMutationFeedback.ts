import { useCallback, useState } from "react";
import type { ToastOptions } from "@/shared/ui/toast/types";
import {
  buildOverlayErrorToastDescription,
  OVERLAY_ERROR_INLINE_THRESHOLD,
} from "@shared/utils/overlayErrorFeedback";

type ToastFn = (options: ToastOptions) => string | number;

interface UseOverlayMutationFeedbackOptions {
  errorTitle: string;
  seeInlineCopy: string;
  toast: ToastFn;
}

export function useOverlayMutationFeedback({
  errorTitle,
  seeInlineCopy,
  toast,
}: UseOverlayMutationFeedbackOptions) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const showOverlayError = useCallback(
    (message: string) => {
      setSubmissionError(message);
      toast({
        variant: "error",
        title: errorTitle,
        description: buildOverlayErrorToastDescription(message, seeInlineCopy),
      });
    },
    [errorTitle, seeInlineCopy, toast],
  );

  const clearOverlayError = useCallback(() => {
    setSubmissionError(null);
  }, []);

  return {
    submissionError,
    showOverlayError,
    clearOverlayError,
    inlineThreshold: OVERLAY_ERROR_INLINE_THRESHOLD,
  };
}
