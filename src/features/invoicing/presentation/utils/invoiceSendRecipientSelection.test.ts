import { describe, expect, it } from "vitest";
import {
  buildSendRecipientKeys,
  defaultSelectedRecipientKeys,
  toggleRecipientKey,
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

  it("defaultSelectedRecipientKeys marca todos los elegibles", () => {
    expect(defaultSelectedRecipientKeys(payload)).toEqual([
      "billing_email",
      "contact:abc",
    ]);
  });

  it("buildSendRecipientKeys omite body cuando están todos marcados", () => {
    expect(
      buildSendRecipientKeys(payload, defaultSelectedRecipientKeys(payload)),
    ).toBeUndefined();
  });

  it("buildSendRecipientKeys envía subset cuando cambia la selección", () => {
    expect(buildSendRecipientKeys(payload, ["billing_email"])).toEqual([
      "billing_email",
    ]);
  });

  it("toggleRecipientKey agrega y quita sin duplicar", () => {
    expect(toggleRecipientKey(["billing_email"], "contact:abc", true)).toEqual([
      "billing_email",
      "contact:abc",
    ]);
    expect(toggleRecipientKey(["billing_email"], "billing_email", false)).toEqual(
      [],
    );
    expect(toggleRecipientKey(["billing_email"], "billing_email", true)).toEqual(
      ["billing_email"],
    );
  });
});
