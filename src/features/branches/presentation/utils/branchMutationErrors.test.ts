import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { getBranchMutationErrorToast } from "./branchMutationErrors";
import { branchesCopy } from "../copy/branchesCopy";

describe("getBranchMutationErrorToast", () => {
  it("maps MAIN_BRANCH_EXISTS to dedicated copy", () => {
    const toast = getBranchMutationErrorToast(
      new ApiError("Ya existe matriz", 400, "MAIN_BRANCH_EXISTS"),
    );

    expect(toast).toEqual({
      title: branchesCopy.errors.mainExists.title,
      description: "Ya existe matriz",
    });
  });

  it("maps MAIN_BRANCH_DELETE_BLOCKED to dedicated copy", () => {
    const toast = getBranchMutationErrorToast(
      new ApiError("No se puede eliminar matriz", 409, "MAIN_BRANCH_DELETE_BLOCKED"),
    );

    expect(toast).toEqual({
      title: branchesCopy.errors.mainDeleteBlocked.title,
      description: "No se puede eliminar matriz",
    });
  });

  it("returns null for unrelated API errors", () => {
    expect(
      getBranchMutationErrorToast(new ApiError("Otro", 400, "UNKNOWN_CODE")),
    ).toBeNull();
  });
});
