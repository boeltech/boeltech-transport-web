import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

import { CatalogsPage } from "./CatalogsPage";
import { catalogsCopy } from "../copy/catalogsCopy";

const refetchTypes = vi.fn();
const refetchStats = vi.fn();

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({
    children,
    sectionTitle,
  }: {
    children: ReactNode;
    sectionTitle?: string;
  }) => (
    <div>
      <span data-testid="settings-section">{sectionTitle}</span>
      {children}
    </div>
  ),
}));

vi.mock("../../application/hooks", () => ({
  useCatalogTypes: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: refetchTypes,
  }),
  useCatalogStatistics: () => ({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch: refetchStats,
  }),
}));

describe("CatalogsPage", () => {
  it("monta SettingsPageShell y error de carga con Reintentar (D1/D8)", async () => {
    const user = userEvent.setup();
    refetchTypes.mockClear();
    refetchStats.mockClear();

    render(
      <MemoryRouter>
        <CatalogsPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("settings-section")).toHaveTextContent(
      catalogsCopy.page.sectionTitle,
    );
    expect(
      screen.getByText(catalogsCopy.state.loadErrorTitle),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: catalogsCopy.state.loadErrorRetry }),
    );
    expect(refetchTypes).toHaveBeenCalledTimes(1);
    expect(refetchStats).toHaveBeenCalledTimes(1);
  });
});
