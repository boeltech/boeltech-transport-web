import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { CatalogItemsTable } from "./CatalogItemsTable";
import { catalogsCopy } from "../copy/catalogsCopy";
import type { CatalogItem } from "../../domain";

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

const NOW = new Date("2026-07-01T12:00:00.000Z");

function buildItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id: "item-1",
    tenantId: null,
    catalogTypeId: "type-1",
    code: "TNE",
    name: "Tonelada",
    description: null,
    parentCode: null,
    sortOrder: 0,
    isActive: true,
    validFrom: null,
    validTo: null,
    metadata: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("CatalogItemsTable", () => {
  it("distingue búsqueda sin coincidencias de catálogo vacío en modo embedded", () => {
    const { rerender } = render(
      <CatalogItemsTable embedded isFiltered items={[]} />,
    );
    expect(screen.getByText(catalogsCopy.table.emptySearch)).toBeInTheDocument();

    rerender(<CatalogItemsTable embedded isFiltered={false} items={[]} />);
    expect(screen.getByText(catalogsCopy.table.emptyAll)).toBeInTheDocument();
  });

  it("oculta la columna de estado cuando todos los valores están activos", () => {
    render(<CatalogItemsTable embedded items={[buildItem()]} />);

    expect(screen.queryByText(catalogsCopy.table.status)).toBeNull();
    expect(screen.queryByText(catalogsCopy.table.active)).toBeNull();
  });

  it("muestra la columna de estado cuando hay algún valor inactivo", () => {
    render(
      <CatalogItemsTable
        embedded
        items={[
          buildItem(),
          buildItem({ id: "item-2", code: "KGM", name: "Kilogramo", isActive: false }),
        ]}
      />,
    );

    expect(screen.getByText(catalogsCopy.table.status)).toBeInTheDocument();
    expect(screen.getByText(catalogsCopy.table.inactive)).toBeInTheDocument();
  });

  it("ofrece copiar el código de cada valor", () => {
    render(<CatalogItemsTable embedded items={[buildItem()]} />);

    expect(
      screen.getByRole("button", { name: catalogsCopy.table.copyCode("TNE") }),
    ).toBeInTheDocument();
  });
});
