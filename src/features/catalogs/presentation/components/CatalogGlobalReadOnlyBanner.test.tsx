import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CatalogGlobalReadOnlyBanner } from "./CatalogGlobalReadOnlyBanner";
import { catalogsCopy } from "../copy/catalogsCopy";

describe("CatalogGlobalReadOnlyBanner", () => {
  it("usa DetailAlertCard info en listado sin CTA inventado (D7)", () => {
    render(<CatalogGlobalReadOnlyBanner variant="list" />);

    expect(
      screen.getByText(catalogsCopy.readOnlyNotice.listTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(catalogsCopy.readOnlyNotice.listDescription),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("usa DetailAlertCard info en detalle global sin CTA (D7)", () => {
    render(
      <CatalogGlobalReadOnlyBanner
        variant="detail"
        scope="global"
        sourceLabel="el SAT"
      />,
    );

    expect(
      screen.getByText(catalogsCopy.readOnlyNotice.detailTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        catalogsCopy.readOnlyNotice.detailOfficialDescription("el SAT"),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
