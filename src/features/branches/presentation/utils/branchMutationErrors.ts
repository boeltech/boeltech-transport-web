import { isApiError } from "@shared/api/interceptors/error-handler";
import { branchesCopy } from "../copy/branchesCopy";

type BranchErrorToast = {
  title: string;
  description?: string;
};

export function getBranchMutationErrorToast(error: Error): BranchErrorToast | null {
  if (!isApiError(error)) return null;

  switch (error.code) {
    case "BRANCH_LIMIT_REACHED":
      return {
        title: branchesCopy.limitReached.title,
        description: error.message || branchesCopy.limitReached.description,
      };
    case "BRANCH_CODE_EXISTS":
      return {
        title: branchesCopy.errors.codeExists.title,
        description: error.message || branchesCopy.errors.codeExists.description,
      };
    case "MAIN_BRANCH_EXISTS":
      return {
        title: branchesCopy.errors.mainExists.title,
        description: error.message || branchesCopy.errors.mainExists.description,
      };
    case "MAIN_BRANCH_DELETE_BLOCKED":
      return {
        title: branchesCopy.errors.mainDeleteBlocked.title,
        description:
          error.message || branchesCopy.errors.mainDeleteBlocked.description,
      };
    default:
      return null;
  }
}
