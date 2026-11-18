import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";

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
    initialData,
  }: {
    open: boolean;
    heading?: string;
    primaryActionLabel?: string;
    consequences?:
      | ReactNode
      | ((live: {
          locationName: string;
          latitude: number | null;
          longitude: number | null;
        }) => ReactNode);
    selectionConfirm?: string;
    hideChromeHeader?: boolean;
    variant?: string;
    initialData?: {
      locationName?: string;
      latitude?: number | null;
      longitude?: number | null;
    };
  }) => {
    if (!open) return null;
    const box =
      typeof consequences === "function"
        ? consequences({
            locationName: initialData?.locationName ?? "",
            latitude: initialData?.latitude ?? null,
            longitude: initialData?.longitude ?? null,
          })
        : consequences;
    return (
      <div
        data-testid="stop-form-inner"
        data-selection-confirm={selectionConfirm}
        data-hide-header={hideChromeHeader ? "true" : "false"}
        data-variant={variant ?? "sheet"}
      >
        <span>{heading}</span>
        <span>{primaryActionLabel}</span>
        {box}
      </div>
    );
  },
}));

const PICK_TECNOLOGICO = {
  locationName: "Tecnológico Santa Fe",
  street: "Av Santa Fe",
  exteriorNumber: "100",
  postalCode: "01376",
  latitude: 19.36,
  longitude: -99.26,
};

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
        onClick={() => onSelect(PICK_TECNOLOGICO)}
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
        consequenceFromLabel="CEDIS Norte"
        consequenceNeighborLatitude={25.7}
        consequenceNeighborLongitude={-100.3}
        initialData={{
          stopCategory: "destination",
          stopType: ["destination", "delivery"],
          locationName: "Soriana Hiper",
          latitude: 25.54,
          longitude: -103.42,
        }}
      />,
    );

    const panel = screen.getByTestId("trip-stop-search-confirm-panel");
    expect(panel).toHaveAttribute("data-step", "confirm");
    expect(panel).toHaveAttribute("data-variant", "sheet");
    expect(panel.className).toMatch(/sm:max-w-xl/);
    expect(panel.className).toMatch(/md:max-w-2xl/);
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

describe("TripStopSearchConfirmSheet F9d", () => {
  it("keeps Confirmar after re-render with a new initialData object", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialStep="search"
        category="origin"
        initialData={{
          stopCategory: "origin",
          stopType: ["origin", "pickup"],
        }}
      />,
    );

    await user.click(screen.getByText("pick-map-result"));
    expect(screen.getByTestId("trip-stop-search-confirm-panel")).toHaveAttribute(
      "data-step",
      "confirm",
    );

    rerender(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialStep="search"
        category="origin"
        initialData={{
          stopCategory: "origin",
          stopType: ["origin", "pickup"],
          locationName: "objeto-nuevo-del-padre",
        }}
      />,
    );

    expect(screen.getByTestId("trip-stop-search-confirm-panel")).toHaveAttribute(
      "data-step",
      "confirm",
    );
    expect(screen.getByTestId("stop-form-inner")).toBeInTheDocument();
  });

  it("reseeds to initialStep when reopened after close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialStep="search"
        category="origin"
      />,
    );

    await user.click(screen.getByText("pick-map-result"));
    expect(screen.getByTestId("trip-stop-search-confirm-panel")).toHaveAttribute(
      "data-step",
      "confirm",
    );

    rerender(
      <TripStopSearchConfirmSheet
        open={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialStep="search"
        category="origin"
      />,
    );
    rerender(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialStep="search"
        category="origin"
      />,
    );

    expect(screen.getByTestId("trip-stop-search-confirm-panel")).toHaveAttribute(
      "data-step",
      "search",
    );
  });
});

describe("TripStopSearchConfirmSheet F9i consecuencias reactivas", () => {
  const vortice = { lat: 19.43, lng: -99.13 };

  it("edit origen + pick: bloque muestra draft → vecino; km ≠ total stale", async () => {
    const user = userEvent.setup();
    const staleTotalKm = 222;
    const expectedKm = estimateRoadDistanceKm(
      PICK_TECNOLOGICO.latitude,
      PICK_TECNOLOGICO.longitude,
      vortice.lat,
      vortice.lng,
    );
    expect(expectedKm).not.toBeNull();
    expect(Math.round(expectedKm!)).not.toBe(staleTotalKm);

    render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialStep="confirm"
        category="origin"
        mode="edit"
        heading="Editar parada 1"
        consequenceToLabel="Vórtice"
        consequenceNeighborLatitude={vortice.lat}
        consequenceNeighborLongitude={vortice.lng}
        initialData={{
          stopCategory: "origin",
          stopType: ["origin", "pickup"],
          locationName: "Amazon México",
          latitude: 19.4,
          longitude: -99.2,
        }}
      />,
    );

    const before = screen.getByTestId("trip-stop-confirm-consequences");
    expect(before).toHaveTextContent("Amazon México → Vórtice");
    expect(before).not.toHaveTextContent(String(staleTotalKm));

    await user.click(
      screen.getByRole("button", { name: copy.action.changeLocation }),
    );
    await user.click(screen.getByText("pick-map-result"));

    const after = screen.getByTestId("trip-stop-confirm-consequences");
    expect(after).toHaveTextContent("Tecnológico Santa Fe → Vórtice");
    expect(after).not.toHaveTextContent("Amazon México");
    expect(after).not.toHaveTextContent(String(staleTotalKm));
    expect(after).toHaveTextContent(
      copy.panel.consequenceDistance(
        expectedKm!.toLocaleString("es-MX", { maximumFractionDigits: 0 }),
      ),
    );
  });

  it("sin coords de vecino: pending sin cifra stale (D-EP-4)", () => {
    render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialStep="confirm"
        category="origin"
        consequenceToLabel="Vórtice"
        initialData={{
          stopCategory: "origin",
          stopType: ["origin", "pickup"],
          locationName: "Tecnológico Santa Fe",
          latitude: 19.36,
          longitude: -99.26,
        }}
      />,
    );

    const box = screen.getByTestId("trip-stop-confirm-consequences");
    expect(box).toHaveTextContent("Tecnológico Santa Fe → Vórtice");
    expect(box).toHaveTextContent(copy.panel.consequenceDistancePending);
    expect(box).not.toHaveTextContent("222");
    expect(box.textContent).not.toMatch(/\d+\s*km/);
  });

  it("create Cambiar destino (F9f): pick actualiza …→ draft", async () => {
    const user = userEvent.setup();
    render(
      <TripStopSearchConfirmSheet
        open
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialStep="search"
        category="destination"
        mode="create"
        consequenceFromLabel="Amazon México"
        consequenceNeighborLatitude={19.4}
        consequenceNeighborLongitude={-99.2}
      />,
    );

    await user.click(screen.getByText("pick-map-result"));

    const box = screen.getByTestId("trip-stop-confirm-consequences");
    expect(box).toHaveTextContent("Amazon México → Tecnológico Santa Fe");
    expect(box).not.toHaveTextContent("Bambú");
  });
});
