import { describe, expect, it } from "vitest";
import {
  buildSendRecipientKeys,
  defaultRecipientSelection,
  toRecipientGroups,
} from "./invoiceSendRecipientSelection";

describe("invoiceSendRecipientSelection", () => {
  const payload = {
    clientId: "client-1",
    clientName: "Cliente Demo",
    recipients: [
      {
        key: "billing_email",
        kind: "billing_email" as const,
        label: "Correo de facturación",
        email: "billing@demo.test",
      },
      {
        key: "contact:abc",
        kind: "contact" as const,
        contactId: "abc",
        label: "Ana Contabilidad",
        email: "ana@demo.test",
      },
    ],
  };

  it("defaultRecipientSelection marca todos los elegibles", () => {
    const groups = toRecipientGroups(payload);
    const selection = defaultRecipientSelection(groups);
    expect(selection["client-1"]).toEqual([
      "billing_email",
      "contact:abc",
    ]);
  });

  it("buildSendRecipientKeys omite body cuando están todos marcados", () => {
    const groups = toRecipientGroups(payload);
    const selection = defaultRecipientSelection(groups);
    expect(buildSendRecipientKeys(payload, selection)).toBeUndefined();
  });

  it("buildSendRecipientKeys envía subset cuando cambia la selección", () => {
    const selection = { "client-1": ["billing_email"] };
    expect(buildSendRecipientKeys(payload, selection)).toEqual([
      "billing_email",
    ]);
  });
});
