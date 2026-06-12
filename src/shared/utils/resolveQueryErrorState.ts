import { isApiError } from "@shared/api/interceptors/error-handler";

export type DetailQueryErrorState =
  | "missingId"
  | "notFound"
  | "forbidden"
  | "serverError"
  | "unknownError"
  | "ready";

export function resolveDetailQueryErrorState(input: {
  missingId?: boolean;
  isError: boolean;
  error: unknown;
  hasData: boolean;
}): DetailQueryErrorState {
  if (input.missingId) return "missingId";
  if (input.hasData) return "ready";
  if (!input.isError || !input.error) return "ready";

  const status = isApiError(input.error) ? input.error.status : undefined;
  if (status === 404) return "notFound";
  if (status === 403) return "forbidden";
  if (status !== undefined && status >= 500) return "serverError";
  if (status !== undefined && status >= 400) return "unknownError";
  return "unknownError";
}
