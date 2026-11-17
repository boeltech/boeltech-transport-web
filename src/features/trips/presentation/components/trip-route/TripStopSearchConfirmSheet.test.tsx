import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripDetailCopy } from "../../copy";
import { TripStopSearchConfirmSheet } from "./TripStopSearchConfirmSheet";

const copy = tripDetailCopy.route;

vi.mock("../../pages/create/components/StopFormSheet", () => ({
  StopFormSheet: ({
    open,
    heading,
    primaryActionLabel,
    consequences,
    selectionConfirm,
    hideChromeHeader,
    variant,
  }: {
    open: boolean;
    heading?: string;
    primaryActionLabel?: string;
    consequences?: unknown;
    selectionConfirm?: string;
    hideChromeHeader?: boolean;
    variant?: string;
  }) =>
    open ? (
      <div
        data-testid="stop-form-inner"
        data-selection-confirm={selectionConfirm}
        data-hide-header={hideChromeHeader ? "true" : "false"}
        data-variant={variant ?? "sheet"}
      >
        <span>{heading}</span>
        <span>{primaryActionLabel}</span>
        {consequences}
      </div>
    ) : null,
}));

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationPicker: ({
      onSelect,
      ariaLabel,
    }: {
      onSelect: (value: import("@shared/ui/location").LocationValue) => void;
      ariaLabel?: string;
    }) => (
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() =>
          onSelect({
            locationName: "Soriana Hiper",
            street: "Av Allende",
            exteriorNumber: "2850",
            postalCode: "27000",
            latitude: 25.54,
            longitude: -103.42,
          })
        }
      >
        pick-map-result
      </button>
    ),
  };
});

describe("TripStopSearchConfirmSheet F9c", () => {
  it("mounts Sheet overlay with ctx, stepper and Usar CTA (no ADR-0092)", () => {
    render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialStep="confirm"
        category="destination"
        heading={copy.panel.chooseDestination}
        contextLine={copy.panel.contextLine("TR-001", 2, 2, copy.panel.roleDestination)}
        initialData={{
          stopCategory: "destination",
          stopType: ["destination", "delivery"],
          locationName: "Soriana Hiper",
        }}
      />,
    );

    const panel = screen.getByTestId("trip-stop-search-confirm-panel");
    expect(panel).toHaveAttribute("data-step", "confirm");
    expect(panel).toHaveAttribute("data-variant", "sheet");
    expect(panel.closest('[role="dialog"]')).not.toBeNull();
    expect(screen.getByTestId("trip-stop-panel-context")).toHaveTextContent(
      "TR-001 · parada 2 de 2 · Entrega",
    );
    expect(screen.getByTestId("trip-stop-panel-stepper")).toHaveTextContent(
      copy.panel.stepSearch,
    );
    expect(screen.getByTestId("stop-form-inner")).toHaveAttribute(
      "data-selection-confirm",
      "immediate",
    );
    expect(screen.getByTestId("stop-form-inner")).toHaveAttribute(
      "data-variant",
      "inline",
    );
    expect(screen.getByTestId("stop-form-inner")).toHaveAttribute(
      "data-hide-header",
      "true",
    );
    expect(screen.getByText(copy.panel.useAsDestination)).toBeInTheDocument();
    expect(
      screen.getByTestId("trip-stop-confirm-consequences"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Confirmar ubicación")).not.toBeInTheDocument();
  });

  it("search pick advances to Confirmar in the same Sheet", async () => {
    const user = userEvent.setup();
    render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialStep="search"
        category="destination"
      />,
    );

    expect(screen.getByTestId("trip-stop-search-confirm-panel")).toHaveAttribute(
      "data-step",
      "search",
    );
    await user.click(screen.getByText("pick-map-result"));
    expect(screen.getByTestId("trip-stop-search-confirm-panel")).toHaveAttribute(
      "data-step",
      "confirm",
    );
    expect(screen.getByTestId("stop-form-inner")).toBeInTheDocument();
    expect(screen.getByTestId("trip-stop-search-confirm-panel").closest('[role="dialog"]')).not.toBeNull();
  });

  it("Cambiar returns from Confirmar to Buscar in the same Sheet", async () => {
    const user = userEvent.setup();
    render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialStep="confirm"
        category="origin"
        initialData={{
          stopCategory: "origin",
          stopType: ["origin", "pickup"],
          locationName: "CEDIS",
        }}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: copy.action.changeLocation }),
    );
    expect(screen.getByTestId("trip-stop-search-confirm-panel")).toHaveAttribute(
      "data-step",
      "search",
    );
  });
});
