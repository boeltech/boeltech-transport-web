import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ListingFilterPanel } from "./ListingFilterPanel";

describe("ListingFilterPanel", () => {
  it("muestra Filtros sin badge ni contenido cuando no hay recortes", () => {
    render(
      <ListingFilterPanel triggerLabel="Filtros" activeCount={0}>
        <span>Campo estado</span>
      </ListingFilterPanel>,
    );

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("Campo estado")).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes", () => {
    render(
      <ListingFilterPanel triggerLabel="Filtros" activeCount={2}>
        <span>Campo estado</span>
      </ListingFilterPanel>,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Campo estado")).toBeInTheDocument();
  });

  it("permite expandir el panel idle", async () => {
    const user = userEvent.setup();
    render(
      <ListingFilterPanel triggerLabel="Filtros" activeCount={0}>
        <span>Campo tipo</span>
      </ListingFilterPanel>,
    );

    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    expect(screen.getByText("Campo tipo")).toBeInTheDocument();
  });
});
