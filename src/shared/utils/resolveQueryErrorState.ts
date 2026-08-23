import {
  isApiError,
  isAxiosError,
} from "@shared/api/interceptors/error-handler";

export type DetailQueryErrorState =
  | "missingId"
  | "notFound"
  | "forbidden"
  | "serverError"
  | "unknownError"
  | "ready";

function resolveHttpStatus(error: unknown): number | undefined {
  if (isApiError(error)) return error.status;
  if (isAxiosError(error)) return error.response?.status;
  return undefined;
}

export function resolveDetailQueryErrorState(input: {
  missingId?: boolean;
  isError: boolean;
  error: unknown;
  hasData: boolean;
}): DetailQueryErrorState {
  if (input.missingId) return "missingId";
  if (input.hasData) return "ready";
  if (!input.isError || !input.error) return "ready";

  const status = resolveHttpStatus(input.error);
  if (status === 404) return "notFound";
  if (status === 403) return "forbidden";
  if (status !== undefined && status >= 500) return "serverError";
  if (status !== undefined && status >= 400) return "unknownError";
  return "unknownError";
}
