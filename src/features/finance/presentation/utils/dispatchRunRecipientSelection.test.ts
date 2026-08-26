import { describe, it, expect } from "vitest";
import type { RecipientsByClient } from "../../domain/billingDispatchRun.types";
import {
  buildRecipientOverrides,
  clientsWithZeroSelected,
  countSelectedRecipients,
  defaultRecipientSelection,
  filterRecipientGroupsByClientIds,
  toggleRecipientKey,
} from "./dispatchRunRecipientSelection";

const groups: RecipientsByClient[] = [
  {
    clientId: "c1",
    clientName: "Acme",
    recipients: [
      {
        key: "billing_email",
        kind: "billing_email",
        label: "Correo de facturación",
        email: "bill@acme.test",
      },
      {
        key: "contact:x",
        kind: "contact",
        contactId: "x",
        label: "Ana",
        email: "ana@acme.test",
      },
    ],
  },
  {
    clientId: "c2",
    clientName: "Beta",
    recipients: [
      {
        key: "billing_email",
        kind: "billing_email",
        label: "Facturación",
        email: "bill@beta.test",
      },
    ],
  },
];

describe("dispatchRunRecipientSelection", () => {
  it("default selecciona todas las keys", () => {
    const selection = defaultRecipientSelection(groups);
    expect(selection.c1).toEqual(["billing_email", "contact:x"]);
    expect(countSelectedRecipients(selection)).toBe(3);
  });

  it("buildRecipientOverrides omite cuando subset = all", () => {
    const selection = defaultRecipientSelection(groups);
    expect(buildRecipientOverrides(groups, selection)).toBeUndefined();
  });

  it("buildRecipientOverrides incluye solo clientes con subset", () => {
    let selection = defaultRecipientSelection(groups);
    selection = toggleRecipientKey(selection, "c1", "billing_email", false);
    expect(buildRecipientOverrides(groups, selection)).toEqual([
      { clientId: "c1", recipientKeys: ["contact:x"] },
    ]);
  });

  it("clientsWithZeroSelected detecta desmarque total", () => {
    let selection = defaultRecipientSelection(groups);
    selection = toggleRecipientKey(selection, "c1", "billing_email", false);
    selection = toggleRecipientKey(selection, "c1", "contact:x", false);
    expect(clientsWithZeroSelected(groups, selection)).toEqual(["c1"]);
  });

  it("filterRecipientGroupsByClientIds acota el set", () => {
    expect(filterRecipientGroupsByClientIds(groups, ["c2"])).toEqual([
      groups[1],
    ]);
  });
});
