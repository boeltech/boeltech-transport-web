import { isApiError } from "@shared/api/interceptors/error-handler";

export function isModuleNotEntitledError(error: unknown): boolean {
  return isApiError(error) && error.code === "MODULE_NOT_ENTITLED";
}
