import { describe, expect, it } from "vitest";

import {
  TRIPS_LIST_PATH,
  TRIPS_FISCAL_ATTENTION_PARAM,
  buildTripsFiscalAttentionHref,
} from "./tripsRoutes";

describe("tripsRoutes", () => {
  it("buildTripsFiscalAttentionHref apunta a Atención fiscal", () => {
    expect(TRIPS_LIST_PATH).toBe("/trips");
    expect(TRIPS_FISCAL_ATTENTION_PARAM).toBe("fiscalAttention");
    expect(buildTripsFiscalAttentionHref()).toBe("/trips?fiscalAttention=1");
  });
});
