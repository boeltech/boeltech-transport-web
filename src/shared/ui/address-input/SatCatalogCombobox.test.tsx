import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SatCatalogCombobox } from "./SatCatalogCombobox";
import { satCatalogComboboxCopy } from "./satCatalogComboboxCopy";

beforeEach(() => {
  // cmdk desplaza el item activo; jsdom no implementa scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn();
});

const OPTIONS = [
  { code: "0001", name: "Moderna" },
  { code: "0002", name: "Centro" },
  { code: "0003", name: "Francisco Zarco" },
];

describe("SatCatalogCombobox", () => {
  it("filters options by name and selects a code", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={OPTIONS}
        value=""
        onValueChange={onValueChange}
        placeholder="Selecciona o captura colonia"
        searchPlaceholder="Buscar colonia…"
        aria-label="Colonia"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /^colonia$/i }));
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "zarco");

    expect(screen.getByText("Francisco Zarco")).toBeInTheDocument();
    expect(screen.queryByText("Moderna")).not.toBeInTheDocument();

    await user.click(screen.getByText("Francisco Zarco"));
    expect(onValueChange).toHaveBeenCalledWith("0003");
  });

  it("shows selected name on the trigger", () => {
    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={OPTIONS}
        value="0002"
        onValueChange={vi.fn()}
        placeholder="Selecciona o captura colonia"
        aria-label="Colonia"
      />,
    );

    expect(screen.getByRole("combobox", { name: /^colonia$/i })).toHaveTextContent(
      "Centro",
    );
  });

  it("shows displayName on the trigger when there is no catalog code", () => {
    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={OPTIONS}
        value=""
        displayName="Francisco Zarco"
        onValueChange={vi.fn()}
        allowFreeText
        onFreeTextSelect={vi.fn()}
        placeholder="Selecciona o captura colonia"
        aria-label="Colonia"
      />,
    );

    expect(screen.getByRole("combobox", { name: /^colonia$/i })).toHaveTextContent(
      "Francisco Zarco",
    );
  });

  it("commits free-text when query has no exact catalog name match", async () => {
    const user = userEvent.setup();
    const onFreeTextSelect = vi.fn();

    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={OPTIONS}
        value=""
        onValueChange={vi.fn()}
        allowFreeText
        onFreeTextSelect={onFreeTextSelect}
        placeholder="Selecciona o captura colonia"
        searchPlaceholder="Buscar colonia…"
        aria-label="Colonia"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /^colonia$/i }));
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "Zarco Libre");

    const freeLabel = satCatalogComboboxCopy.useAsFreeText("Zarco Libre");
    await user.click(screen.getByText(freeLabel));
    expect(onFreeTextSelect).toHaveBeenCalledWith("Zarco Libre");
  });

  it("does not show free-text item when query exactly matches an option name", async () => {
    const user = userEvent.setup();

    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={OPTIONS}
        value=""
        onValueChange={vi.fn()}
        allowFreeText
        onFreeTextSelect={vi.fn()}
        placeholder="Selecciona o captura colonia"
        searchPlaceholder="Buscar colonia…"
        aria-label="Colonia"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /^colonia$/i }));
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "Moderna");

    expect(
      screen.queryByText(satCatalogComboboxCopy.useAsFreeText("Moderna")),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Moderna")).toBeInTheDocument();
  });

  it("allows free-text when there are no catalog options", async () => {
    const user = userEvent.setup();
    const onFreeTextSelect = vi.fn();

    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={[]}
        value=""
        onValueChange={vi.fn()}
        allowFreeText
        onFreeTextSelect={onFreeTextSelect}
        placeholder="Selecciona o captura colonia"
        searchPlaceholder="Buscar colonia…"
        aria-label="Colonia"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /^colonia$/i }));
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "Solo Libre");

    await user.click(
      screen.getByText(satCatalogComboboxCopy.useAsFreeText("Solo Libre")),
    );
    expect(onFreeTextSelect).toHaveBeenCalledWith("Solo Libre");
  });

  it("selects Real Solare and does not show Santa Rita when shorts collide", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    const colliding = [
      { code: "76240-0001", name: "Santa Rita" },
      { code: "76246-0042", name: "Real Solare" },
    ];

    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={colliding}
        value=""
        onValueChange={onValueChange}
        placeholder="Selecciona o captura colonia"
        searchPlaceholder="Buscar colonia…"
        aria-label="Colonia"
        postalCode="76246"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /^colonia$/i }));
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "Real So");

    expect(screen.getByText("Real Solare")).toBeInTheDocument();
    expect(screen.queryByText("Santa Rita")).not.toBeInTheDocument();

    await user.click(screen.getByText("Real Solare"));
    expect(onValueChange).toHaveBeenCalledWith("76246-0042");
  });

  it("shows displayName when short code is ambiguous", () => {
    render(
      <SatCatalogCombobox
        id="colonia-catalog"
        options={[
          { code: "76240-0001", name: "Santa Rita" },
          { code: "76246-0001", name: "Real Solare" },
        ]}
        value="0001"
        displayName="Real Solare"
        onValueChange={vi.fn()}
        placeholder="Selecciona o captura colonia"
        aria-label="Colonia"
      />,
    );

    expect(screen.getByRole("combobox", { name: /^colonia$/i })).toHaveTextContent(
      "Real Solare",
    );
    expect(screen.getByRole("combobox", { name: /^colonia$/i })).not.toHaveTextContent(
      "Santa Rita",
    );
  });
});
