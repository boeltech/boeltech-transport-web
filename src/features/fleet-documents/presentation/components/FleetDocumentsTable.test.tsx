import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { DocumentExpiryItem } from "../../domain";
import { fleetDocumentsCopy } from "../copy";
import { FleetDocumentsTable } from "./FleetDocumentsTable";

const copy = fleetDocumentsCopy.table;

const item: DocumentExpiryItem = {
  entityType: "driver",
  entityId: "d-1",
  entityLabel: "Luis García",
  docType: "license",
  expiresOn: "2026-12-01",
  daysRemaining: 17,
  severity: "warning",
};

function renderTable(items: DocumentExpiryItem[] = [item]) {
  return render(
    <MemoryRouter>
      <FleetDocumentsTable items={items} isLoading={false} />
    </MemoryRouter>,
  );
}

describe("FleetDocumentsTable", () => {
  it("retorna null cuando no hay filas", () => {
    const { container } = renderTable([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("link primario a documentos del conductor", () => {
    renderTable();
    expect(
      screen.getByRole("columnheader", { name: copy.entity }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Luis García" });
    expect(link).toHaveAttribute(
      "href",
      "/drivers/d-1?tab=documents",
    );
  });
});
