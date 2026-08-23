import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { resolveDetailQueryErrorState } from "./resolveQueryErrorState";

function axiosLikeError(status: number) {
  return {
    isAxiosError: true,
    response: { status },
    message: `Request failed with status code ${status}`,
  };
}

describe("resolveDetailQueryErrorState", () => {
  it("returns ready when data is present", () => {
    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: axiosLikeError(403),
        hasData: true,
      }),
    ).toBe("ready");
  });

  it("returns missingId when id is absent", () => {
    expect(
      resolveDetailQueryErrorState({
        missingId: true,
        isError: false,
        error: null,
        hasData: false,
      }),
    ).toBe("missingId");
  });

  it("classifies ApiError 403 as forbidden", () => {
    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: new ApiError("Forbidden", 403),
        hasData: false,
      }),
    ).toBe("forbidden");
  });

  it("classifies Axios 403 as forbidden", () => {
    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: axiosLikeError(403),
        hasData: false,
      }),
    ).toBe("forbidden");
  });

  it("classifies Axios 404 as notFound", () => {
    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: axiosLikeError(404),
        hasData: false,
      }),
    ).toBe("notFound");
  });

  it("classifies Axios 500 as serverError", () => {
    expect(
      resolveDetailQueryErrorState({
        isError: true,
        error: axiosLikeError(500),
        hasData: false,
      }),
    ).toBe("serverError");
  });
});
