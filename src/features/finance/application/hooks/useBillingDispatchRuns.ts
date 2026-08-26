import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/utils/errorMapper";
import type {
  ConfirmSendDispatchRunPayload,
  CreateBillingDispatchRunPayload,
  DispatchRunStatus,
} from "../../domain/billingDispatchRun.types";
import {
  cancelBillingDispatchRun,
  confirmSendBillingDispatchRun,
  createBillingDispatchRun,
  fetchBillingDispatchRunById,
  fetchBillingDispatchRuns,
  previewBillingDispatchRun,
} from "../../infrastructure/billingDispatchRunsApi";
import { dispatchRunsCopy } from "../../presentation/copy/dispatchRunsCopy";

function confirmSendErrorDescription(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === "DISPATCH_RECIPIENTS_REQUIRED") {
      return dispatchRunsCopy.detail.confirm.recipientsRequired;
    }
    if (error.code === "DISPATCH_RECIPIENT_KEY_INVALID") {
      return dispatchRunsCopy.detail.confirm.recipientKeyInvalid;
    }
    if (error.code === "DISPATCH_FORCE_RESEND_INVOICE_INVALID") {
      return dispatchRunsCopy.detail.resendConfirm.forceResendInvalid;
    }
    if (error.code === "INVOICE_SEND_COOLDOWN") {
      return dispatchRunsCopy.detail.resendConfirm.cooldown;
    }
    const summary = error.details?.error_summary;
    if (typeof summary === "string" && summary.trim()) {
      return summary.trim();
    }
  }
  return getErrorMessage(error);
}

export const billingDispatchRunKeys = {
  all: ["billing-dispatch-runs"] as const,
  list: (params?: {
    status?: DispatchRunStatus;
    billingSchemeId?: string;
    page?: number;
    limit?: number;
  }) => [...billingDispatchRunKeys.all, "list", params ?? {}] as const,
  detail: (id: string) =>
    [...billingDispatchRunKeys.all, "detail", id] as const,
};

export function useBillingDispatchRuns(params?: {
  status?: DispatchRunStatus;
  billingSchemeId?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...listParams } = params ?? {};
  return useQuery({
    queryKey: billingDispatchRunKeys.list(listParams),
    queryFn: () => fetchBillingDispatchRuns(listParams),
    enabled,
    staleTime: 1000 * 30,
  });
}

const IN_FLIGHT_DISPATCH_STATUSES = new Set(["send_confirmed", "sending"]);

export function useBillingDispatchRun(id: string | undefined) {
  return useQuery({
    queryKey: billingDispatchRunKeys.detail(id ?? ""),
    queryFn: () => fetchBillingDispatchRunById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 15,
    // D7: poll while the run is sending so the operator sees progress.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && IN_FLIGHT_DISPATCH_STATUSES.has(status) ? 3000 : false;
    },
  });
}

export function useCreateBillingDispatchRun() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateBillingDispatchRunPayload) =>
      createBillingDispatchRun(payload),
    onSuccess: (run) => {
      void queryClient.invalidateQueries({
        queryKey: billingDispatchRunKeys.all,
      });
      void queryClient.setQueryData(
        billingDispatchRunKeys.detail(run.id),
        run,
      );
      toast({ title: dispatchRunsCopy.toast.runCreated });
    },
    onError: () => {
      toast({
        title: dispatchRunsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export function usePreviewBillingDispatchRun() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => previewBillingDispatchRun(id),
    onSuccess: (run) => {
      void queryClient.setQueryData(
        billingDispatchRunKeys.detail(run.id),
        run,
      );
      void queryClient.invalidateQueries({
        queryKey: billingDispatchRunKeys.list(),
      });
      toast({ title: dispatchRunsCopy.toast.previewUpdated });
    },
    onError: () => {
      toast({
        title: dispatchRunsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export function useConfirmSendBillingDispatchRun() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload?: ConfirmSendDispatchRunPayload;
    }) => confirmSendBillingDispatchRun(id, payload),
    // No idempotente: un retry tras 502 deja la corrida en failed y el 2º POST da 409.
    retry: false,
    onSuccess: (run) => {
      void queryClient.setQueryData(
        billingDispatchRunKeys.detail(run.id),
        run,
      );
      void queryClient.invalidateQueries({
        queryKey: billingDispatchRunKeys.all,
      });
      if (run.status === "failed") {
        toast({
          title: dispatchRunsCopy.toast.sendFailedTitle,
          description:
            run.errorSummary ?? dispatchRunsCopy.detail.result.errorHint,
          variant: "destructive",
        });
        return;
      }
      toast({ title: dispatchRunsCopy.toast.sendConfirmed });
    },
    onError: (error, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: billingDispatchRunKeys.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: billingDispatchRunKeys.all,
      });
      toast({
        title: dispatchRunsCopy.toast.sendFailedTitle,
        description: confirmSendErrorDescription(error),
        variant: "destructive",
      });
    },
  });
}

export function useCancelBillingDispatchRun() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => cancelBillingDispatchRun(id),
    onSuccess: (run) => {
      void queryClient.setQueryData(
        billingDispatchRunKeys.detail(run.id),
        run,
      );
      void queryClient.invalidateQueries({
        queryKey: billingDispatchRunKeys.all,
      });
      toast({ title: dispatchRunsCopy.toast.cancelled });
    },
    onError: () => {
      toast({
        title: dispatchRunsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}
