import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL,
  isV1CargoPlaceholderClientId,
} from "./v1CargoPlaceholderClient";

describe("v1CargoPlaceholderClient", () => {
  it("identifies the sentinel UUID", () => {
    expect(isV1CargoPlaceholderClientId(V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL)).toBe(
      true,
    );
    expect(isV1CargoPlaceholderClientId("other-uuid")).toBe(false);
    expect(isV1CargoPlaceholderClientId(undefined)).toBe(false);
  });

  it("sentinel passes createCargoSchema client_id UUID validation", () => {
    expect(z.string().uuid().safeParse(V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL).success).toBe(
      true,
    );
  });
});
