/**
 * Redirect P3 — legacy lote path → formulario único.
 */
import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { buildRegisterCollectionPath } from "@features/finance/application";

import { OperationalReceiptBatchCreatePage } from "./OperationalReceiptBatchCreatePage";

const CLIENT_ID = "client-batch";

describe("OperationalReceiptBatchCreatePage", () => {
  it("redirects legacy path to /finance/collections/new", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/clients/:id/operational-receipt-batches/new",
          element: <OperationalReceiptBatchCreatePage />,
        },
        {
          path: "/finance/collections/new",
          element: <div data-testid="register-collection">form</div>,
        },
      ],
      {
        initialEntries: [
          `/clients/${CLIENT_ID}/operational-receipt-batches/new`,
        ],
      },
    );

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/finance/collections/new");
    });
    expect(router.state.location.search).toContain("channel=without_invoice");
    expect(router.state.location.search).toContain(`clientId=${CLIENT_ID}`);
    expect(buildRegisterCollectionPath({
      channel: "without_invoice",
      clientId: CLIENT_ID,
    })).toContain("/finance/collections/new");
  });
});
