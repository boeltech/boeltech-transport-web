import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { financeCopy } from "../copy";
import {
  CLIENT_PORTAL_INVOICES_ORIENTATION_STORAGE_KEY,
  ClientPortalInvoicesOrientationAlert,
} from "./ClientPortalInvoicesOrientationAlert";

const copy = financeCopy.page.clientOrientation;
const TEST_KEY = `${CLIENT_PORTAL_INVOICES_ORIENTATION_STORAGE_KEY}.test`;

describe("ClientPortalInvoicesOrientationAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña Borrador ≠ Facturado y persiste collapsed=true", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ClientPortalInvoicesOrientationAlert storageKey={TEST_KEY} />,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.title).toMatch(/Borrador/i);
    expect(copy.title).toMatch(/Facturado/i);
    expect(copy.body).not.toMatch(/Timbrada|Enviar|Cobrar|Nueva factura/i);

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(<ClientPortalInvoicesOrientationAlert storageKey={TEST_KEY} />);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
