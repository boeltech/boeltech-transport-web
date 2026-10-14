import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { CatalogsPage } from "./CatalogsPage";
import { catalogsCopy } from "../copy/catalogsCopy";

const NOW = new Date("2026-07-01T12:00:00.000Z");

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
    data: [
      {
        id: "type-1",
        code: "sat_forma_pago",
        name: "Formas de pago",
        description: null,
        source: "SAT",
        parentTypeCode: null,
        isHierarchical: false,
        isGlobal: true,
        metadataSchema: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCatalogStatistics: () => ({
    data: [
      {
        typeCode: "sat_forma_pago",
        typeName: "Formas de pago",
        itemCount: 21,
        source: "SAT",
        currentVersion: "1.0",
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("CatalogsPage directory", () => {
  it("renderiza EntityListCard del directorio y navega al detalle (D5)", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/settings/catalogs"]}>
        <Routes>
          <Route path="/settings/catalogs" element={<CatalogsPage />} />
          <Route
            path="/settings/catalogs/:typeCode"
            element={<div data-testid="catalog-detail">detalle</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("settings-section")).toHaveTextContent(
      catalogsCopy.page.sectionTitle,
    );
    expect(
      screen.getByText(catalogsCopy.readOnlyNotice.listTitle),
    ).toBeInTheDocument();
    expect(screen.getByText("Formas de pago")).toBeInTheDocument();

    await user.click(screen.getByText("Formas de pago"));
    expect(screen.getByTestId("catalog-detail")).toBeInTheDocument();
  });

  it("muestra EmptyState cuando la búsqueda no coincide (D6)", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CatalogsPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByPlaceholderText(catalogsCopy.page.searchPlaceholder),
      "zzz-sin-match",
    );

    expect(
      screen.getByText(catalogsCopy.page.emptySearchTitle),
    ).toBeInTheDocument();
  });
});
