import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  ADMIN_BILLING_ORIENTATION_STORAGE_KEY,
  AdminBillingOrientationAlert,
} from "./AdminBillingOrientationAlert";

const copy = billingSettingsCopy.adminOrientation;
const TEST_KEY = `${ADMIN_BILLING_ORIENTATION_STORAGE_KEY}.test`;

function renderAlert(identityMissing = false) {
  return render(
    <MemoryRouter>
      <AdminBillingOrientationAlert
        storageKey={TEST_KEY}
        identityMissing={identityMissing}
      />
    </MemoryRouter>,
  );
}

describe("AdminBillingOrientationAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña sello + numeración y persiste collapsed=true; sin Stripe ni esquemas", async () => {
    const user = userEvent.setup();
    const { unmount } = renderAlert();

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.body).toMatch(/sello/i);
    expect(copy.body).toMatch(/folio|serie|numeración/i);
    expect(copy.body).not.toMatch(/Stripe|esquema|PAC|Tu plan/i);
    expect(screen.queryByRole("link", { name: copy.identityLink })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    renderAlert();
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });

  it("si falta identidad, enlaza a General", () => {
    renderAlert(true);

    expect(screen.getByText(copy.identityMissing)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.identityLink })).toHaveAttribute(
      "href",
      "/settings/general",
    );
  });
});
