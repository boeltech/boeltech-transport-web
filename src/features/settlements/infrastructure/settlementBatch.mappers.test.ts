import { describe, expect, it } from "vitest";
import {
  mapSettlementBatchActionResult,
  type ApiSettlementBatchActionRaw,
} from "./mappers";

const raw: ApiSettlementBatchActionRaw = {
  processed: [
    {
      settlement_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      settlement_number: "PAG-0451",
      status: "approved",
      net_amount: 13270,
      approval_outcome: "approved",
    },
  ],
  omitted: [
    {
      settlement_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      reason_code: "self_actor",
      reason: "No puedes autorizar un pago que tú armaste",
      http_status: 403,
    },
  ],
};

describe("mapSettlementBatchActionResult", () => {
  it("maps snake_case processed + omitted (R6)", () => {
    const mapped = mapSettlementBatchActionResult(raw, "1 autorizada; 1 omitida");

    expect(mapped.message).toBe("1 autorizada; 1 omitida");
    expect(mapped.processed).toEqual([
      {
        settlementId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        settlementNumber: "PAG-0451",
        status: "approved",
        netAmount: 13270,
        approvalOutcome: "approved",
        disbursementMethod: null,
      },
    ]);
    expect(mapped.omitted).toEqual([
      {
        settlementId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        reasonCode: "self_actor",
        reason: "No puedes autorizar un pago que tú armaste",
        httpStatus: 403,
      },
    ]);
  });

  it("tolerates empty arrays", () => {
    const mapped = mapSettlementBatchActionResult({
      processed: [],
      omitted: [],
    });
    expect(mapped.processed).toEqual([]);
    expect(mapped.omitted).toEqual([]);
  });
});
