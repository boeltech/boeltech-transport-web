import { describe, expect, it } from "vitest";
import type { TripRevenueSplit } from "@features/trips/domain";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import {
  buildEmptyRevenueSplitFormValues,
  createTripRevenueSplitFormSchema,
  getSplitHydrationRevision,
  mapRevenueSplitValidationErrorToRhfPath,
  mapRevenueSplitValidationErrorToUserMessage,
  validateTripRevenueSplitDraftLegs,
  type TripRevenueSplitFormValidationMessages,
} from "./tripRevenueSplitDraft";

const CLIENT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CLIENT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const splitCopy = tripFiscalCopy.revenueSplit;

const productMessages: TripRevenueSplitFormValidationMessages = {
  tripClientRequired: splitCopy.tripClientRequired,
  tripClientNotInLegs: splitCopy.tripClientNotInLegs,
  minLegs: splitCopy.errors.minLegs,
  maxLegs: splitCopy.errors.maxLegs(10),
  clientRequired: splitCopy.errors.clientRequired,
  clientDuplicate: splitCopy.errors.clientDuplicate,
  sharePercentInvalid: splitCopy.errors.sharePercentInvalid,
  sharesInvalid: splitCopy.errors.sharesInvalid,
  multipleCartaPorte: splitCopy.errors.multipleCartaPorte,
  unknown: splitCopy.errors.unknown,
};

describe("getSplitHydrationRevision", () => {
  it("returns none for null/undefined", () => {
    expect(getSplitHydrationRevision(null)).toBe("none");
    expect(getSplitHydrationRevision(undefined)).toBe("none");
  });

  it("uses id and updatedAt", () => {
    const split = {
      id: "split-1",
      updatedAt: "2026-08-22T12:00:00.000Z",
    } as TripRevenueSplit;
    expect(getSplitHydrationRevision(split)).toBe(
      "split-1:2026-08-22T12:00:00.000Z",
    );
  });
});

describe("mapRevenueSplitValidationErrorToRhfPath", () => {
  it("maps clientId path", () => {
    expect(
      mapRevenueSplitValidationErrorToRhfPath({
        code: "SPLIT_LEG_CLIENT_DUPLICATE",
        message: "dup",
        path: "legs[1].clientId",
      }),
    ).toEqual(["legs", 1, "clientId"]);
  });

  it("maps sharePercent path", () => {
    expect(
      mapRevenueSplitValidationErrorToRhfPath({
        code: "SPLIT_SHARE_PERCENT_INVALID",
        message: "bad %",
        path: "legs[0].sharePercent",
      }),
    ).toEqual(["legs", 0, "sharePercent"]);
  });

  it("maps root legs / shares invalid to first sharePercent", () => {
    expect(
      mapRevenueSplitValidationErrorToRhfPath({
        code: "SPLIT_SHARES_INVALID",
        message: "sum",
        path: "legs",
      }),
    ).toEqual(["legs", 0, "sharePercent"]);
  });
});

describe("mapRevenueSplitValidationErrorToUserMessage", () => {
  it("maps duplicate client without technical jargon", () => {
    const message = mapRevenueSplitValidationErrorToUserMessage(
      {
        code: "SPLIT_LEG_CLIENT_DUPLICATE",
        message: "client_id duplicado en el prorrateo: abc",
        path: "legs[1].clientId",
      },
      productMessages,
    );
    expect(message).toBe(splitCopy.errors.clientDuplicate);
    expect(message.toLowerCase()).not.toMatch(/pierna|client_id|share_percent/);
  });

  it("maps shares invalid with readable sum", () => {
    const message = mapRevenueSplitValidationErrorToUserMessage(
      {
        code: "SPLIT_SHARES_INVALID",
        message: "La suma de share_percent debe ser 100 (actual: 90)",
        path: "legs",
      },
      productMessages,
      { shareSum: 90 },
    );
    expect(message).toBe(splitCopy.errors.sharesInvalid("90"));
    expect(message.toLowerCase()).not.toMatch(/pierna|share_percent/);
  });

  it("maps multiple Carta Porte without pierna", () => {
    const message = mapRevenueSplitValidationErrorToUserMessage(
      {
        code: "SPLIT_MULTIPLE_CARTA_PORTE_BEARERS",
        message: "Solo una pierna puede sugerir Carta Porte (0 o 1)",
        path: "legs",
      },
      productMessages,
    );
    expect(message).toBe(splitCopy.errors.multipleCartaPorte);
    expect(message.toLowerCase()).not.toContain("pierna");
  });
});

describe("validateTripRevenueSplitDraftLegs", () => {
  it("accepts 60/40 with distinct clients", () => {
    const result = validateTripRevenueSplitDraftLegs([
      { clientId: CLIENT_A, sharePercent: "60" },
      { clientId: CLIENT_B, sharePercent: "40" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate clientId", () => {
    const result = validateTripRevenueSplitDraftLegs([
      { clientId: CLIENT_A, sharePercent: 60 },
      { clientId: CLIENT_A, sharePercent: 40 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SPLIT_LEG_CLIENT_DUPLICATE");
    }
  });

  it("rejects share sum not equal to 100", () => {
    const result = validateTripRevenueSplitDraftLegs([
      { clientId: CLIENT_A, sharePercent: "50" },
      { clientId: CLIENT_B, sharePercent: "40" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SPLIT_SHARES_INVALID");
    }
  });
});

describe("createTripRevenueSplitFormSchema", () => {
  const schema = createTripRevenueSplitFormSchema(productMessages);

  it("accepts valid activate payload", () => {
    const result = schema.safeParse({
      ...buildEmptyRevenueSplitFormValues(CLIENT_A, 1000),
      tripClientId: CLIENT_A,
      legs: [
        { clientId: CLIENT_A, sharePercent: 60 },
        { clientId: CLIENT_B, sharePercent: 40 },
      ],
      activateOnSave: true,
    });
    expect(result.success).toBe(true);
  });

  it("surfaces product copy for duplicate clients", () => {
    const result = schema.safeParse({
      basisAmount: 1000,
      tripClientId: CLIENT_A,
      legs: [
        { clientId: CLIENT_A, sharePercent: 60 },
        { clientId: CLIENT_A, sharePercent: 40 },
      ],
      cpCarrier: "none",
      activateOnSave: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((item) =>
        item.message.includes("reparto"),
      );
      expect(issue?.message).toBe(splitCopy.errors.clientDuplicate);
      expect(issue?.message.toLowerCase()).not.toMatch(/pierna|client_id/);
    }
  });

  it("surfaces product copy for sum ≠ 100", () => {
    const result = schema.safeParse({
      basisAmount: 1000,
      tripClientId: CLIENT_A,
      legs: [
        { clientId: CLIENT_A, sharePercent: 50 },
        { clientId: CLIENT_B, sharePercent: 40 },
      ],
      cpCarrier: "none",
      activateOnSave: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const shareIssue = result.error.issues.find(
        (issue) =>
          issue.path[0] === "legs" &&
          issue.path[1] === 0 &&
          issue.path[2] === "sharePercent",
      );
      expect(shareIssue?.message).toBe(splitCopy.errors.sharesInvalid("90"));
      expect(shareIssue?.message.toLowerCase()).not.toMatch(
        /pierna|share_percent/,
      );
    }
  });

  it("places invalid sharePercent on legs[i].sharePercent with product copy", () => {
    const result = schema.safeParse({
      basisAmount: 1000,
      tripClientId: CLIENT_A,
      legs: [
        { clientId: CLIENT_A, sharePercent: 0 },
        { clientId: CLIENT_B, sharePercent: 40 },
      ],
      cpCarrier: "none",
      activateOnSave: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const shareIssue = result.error.issues.find(
        (issue) =>
          issue.path[0] === "legs" &&
          issue.path[1] === 0 &&
          issue.path[2] === "sharePercent",
      );
      expect(shareIssue).toBeDefined();
      expect(shareIssue?.message).toBe(splitCopy.errors.sharePercentInvalid);
      expect(shareIssue?.message.toLowerCase()).not.toMatch(
        /pierna|share_percent/,
      );
    }
  });
});
