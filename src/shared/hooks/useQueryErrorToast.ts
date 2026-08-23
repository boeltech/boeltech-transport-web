import { useEffect, useRef } from "react";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useToast } from "./useToast";

export type UseQueryErrorToastOptions = {
  isError: boolean;
  error: unknown;
  title: string;
  /** When false, never toast (e.g. tab queries disabled). Default true. */
  enabled?: boolean;
};

/**
 * Shows a destructive toast once per distinct query error.
 * Avoids duplicate toasts on remount / refetch of the same failure.
 */
export function useQueryErrorToast({
  isError,
  error,
  title,
  enabled = true,
}: UseQueryErrorToastOptions): void {
  const { toast } = useToast();
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isError || !error) {
      if (!isError) {
        lastFingerprintRef.current = null;
      }
      return;
    }

    const fingerprint = getErrorMessage(error);
    if (lastFingerprintRef.current === fingerprint) return;
    lastFingerprintRef.current = fingerprint;

    toast({
      variant: "destructive",
      title,
      description: fingerprint,
    });
  }, [enabled, isError, error, title, toast]);
}
