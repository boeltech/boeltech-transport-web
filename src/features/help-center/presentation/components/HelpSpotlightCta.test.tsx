import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelpSpotlightCta } from "./HelpSpotlightCta";

const trackHelpEvent = vi.fn();

vi.mock("../../application/trackHelpEvent", () => ({
  trackHelpEvent: (...args: unknown[]) => trackHelpEvent(...args),
}));

vi.mock("@shared/config/env", () => ({
  default: {
    help: { spotlightEnabled: true },
  },
}));

describe("HelpSpotlightCta", () => {
  beforeEach(() => {
    trackHelpEvent.mockClear();
    document.body.innerHTML = "";
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render when article has no registry targets", () => {
    render(
      <MemoryRouter>
        <HelpSpotlightCta
          articleId="alta-cliente"
          articleScreens={["/clients"]}
          pathname="/clients"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("help-spotlight-cta")).not.toBeInTheDocument();
  });

  it("does not render when pathname is outside screens", () => {
    render(
      <MemoryRouter>
        <HelpSpotlightCta
          articleId="facturar-viaje"
          articleScreens={["/finance/invoiceable"]}
          pathname="/trips"
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("help-spotlight-cta")).not.toBeInTheDocument();
  });

  it("shows unavailable path and emits help_spotlight_unavailable when anchor missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HelpSpotlightCta
          articleId="facturar-viaje"
          articleScreens={["/finance/invoiceable"]}
          pathname="/finance/invoiceable"
          onRequestTicket={vi.fn()}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("help-spotlight-cta"));

    expect(
      await screen.findByTestId("help-spotlight-unavailable"),
    ).toHaveTextContent("No está disponible en esta vista");
    expect(trackHelpEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "help_spotlight_unavailable",
        articleId: "facturar-viaje",
        payload: {
          anchorId: "inv-facturar-row",
          reason: "not_in_dom",
        },
      }),
    );
  });

  it("emits help_spotlight_shown when anchor is visible", async () => {
    const user = userEvent.setup();
    const btn = document.createElement("button");
    btn.setAttribute("data-help-anchor", "inv-facturar-row");
    btn.textContent = "Facturar";
    // jsdom: give a client rect via mock
    Object.defineProperty(btn, "getClientRects", {
      value: () => [{ width: 40, height: 20 }],
    });
    Object.defineProperty(btn, "getBoundingClientRect", {
      value: () => ({
        top: 10,
        left: 10,
        width: 40,
        height: 20,
        bottom: 30,
        right: 50,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(btn);

    render(
      <MemoryRouter>
        <HelpSpotlightCta
          articleId="facturar-viaje"
          articleScreens={["/finance/invoiceable"]}
          pathname="/finance/invoiceable"
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("help-spotlight-cta"));

    await waitFor(() => {
      expect(trackHelpEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: "help_spotlight_shown",
          payload: { anchorId: "inv-facturar-row" },
        }),
      );
    });
    expect(screen.getByTestId("help-spotlight-overlay")).toBeInTheDocument();
  });
});
