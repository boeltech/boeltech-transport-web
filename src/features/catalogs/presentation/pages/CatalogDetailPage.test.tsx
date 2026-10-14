import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { CatalogDetailPage } from "./CatalogDetailPage";
import { catalogsCopy } from "../copy/catalogsCopy";

const refetchTypes = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => false,
  }),
}));

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({
    children,
    sectionTitle,
    hideSidebar,
  }: {
    children: ReactNode;
    sectionTitle?: string;
    hideSidebar?: boolean;
  }) => (
    <div>
      <span data-testid="settings-section">{sectionTitle}</span>
      <span data-testid="hide-sidebar">{String(Boolean(hideSidebar))}</span>
      {children}
    </div>
  ),
}));

vi.mock("@features/settings/presentation/components/SettingsLayout", () => ({
  SettingsCard: ({
    children,
    title,
  }: {
    children: ReactNode;
    title?: string;
  }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
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
  }),
  useCatalogItems: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCatalogSearch: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("CatalogDetailPage", () => {
  it("usa hideSidebar y error de carga con Reintentar (D2/D8)", async () => {
    const user = userEvent.setup();
    refetchTypes.mockClear();

    render(
      <MemoryRouter initialEntries={["/settings/catalogs/sat_forma_pago"]}>
        <Routes>
          <Route
            path="/settings/catalogs/:typeCode"
            element={<CatalogDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("hide-sidebar")).toHaveTextContent("true");
    expect(
      screen.getByText(catalogsCopy.state.loadErrorDetailTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: catalogsCopy.detail.back }),
    ).toHaveAttribute("href", "/settings/catalogs");

    await user.click(
      screen.getByRole("button", { name: catalogsCopy.state.loadErrorRetry }),
    );
    expect(refetchTypes).toHaveBeenCalledTimes(1);
  });
});
