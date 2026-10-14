import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { generalSettingsCopy } from "../copy/generalSettingsCopy";
import { GeneralSettingsPage } from "./GeneralSettingsPage";

const refetch = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("../../application/hooks", () => ({
  useCompanySettings: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch,
  }),
  useCompanyLogoObjectUrl: () => ({ logoSrc: null }),
}));

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({
    children,
    sectionTitle,
  }: {
    children: unknown;
    sectionTitle?: string;
  }) => (
    <div>
      <span data-testid="settings-section">{sectionTitle}</span>
      {children}
    </div>
  ),
}));

describe("GeneralSettingsPage", () => {
  it("error de carga usa DetailAlertCard.action Reintentar (D6)", async () => {
    const user = userEvent.setup();
    refetch.mockClear();

    render(
      <MemoryRouter>
        <GeneralSettingsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(generalSettingsCopy.state.loadErrorTitle),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings-section")).toHaveTextContent(
      generalSettingsCopy.page.sectionTitle,
    );

    await user.click(
      screen.getByRole("button", {
        name: generalSettingsCopy.state.loadErrorRetry,
      }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
