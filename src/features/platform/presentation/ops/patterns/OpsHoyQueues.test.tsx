import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsHoyQueues } from "./OpsHoyQueues";

describe("OpsHoyQueues (L2 M5)", () => {
  it("renders mono title queue counts and marks the active chip", () => {
    render(
      <div className="platform-ops">
        <OpsHoyQueues
          chips={[
            { id: "activation", label: "Activar admin", count: 3 },
            { id: "trial", label: "Trial ≤7d", count: 0 },
            { id: "past_due", label: "Cobro pendiente", count: 1 },
            { id: "suspended", label: "Suspendidos", count: 0 },
          ]}
          activeQueue="activation"
          onQueueChange={vi.fn()}
          emptyTitle="Cola vacía"
          emptyDescription="Nada"
        >
          <p>filas</p>
        </OpsHoyQueues>
      </div>,
    );

    const counts = screen.getAllByText(/^[0301]$/);
    expect(counts.length).toBeGreaterThanOrEqual(3);
    expect(document.querySelector("[data-ops-hoy-count]")).toHaveClass(
      "ops-hoy-queue-count",
    );
    expect(
      screen.getByRole("tab", { name: /Activar admin/ }),
    ).toHaveAttribute("data-active", "true");
    expect(
      screen.getByRole("tab", { name: /Activar admin/ }),
    ).toHaveAttribute("aria-controls", "ops-hoy-queue-panel");
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "ops-hoy-queue-panel",
    );
    expect(
      screen
        .getByRole("tab", { name: /Trial/ })
        .querySelector("[data-ops-hoy-count]"),
    ).toHaveAttribute("data-empty", "true");
    expect(
      screen
        .getByRole("tab", { name: /Cobro pendiente/ })
        .querySelector("[data-ops-hoy-count]"),
    ).toHaveAttribute("data-count-tone", "warn");
    expect(
      screen.getByRole("tab", { name: /Cobro pendiente/ }),
    ).toHaveAttribute("data-tick-tone", "warn");
    expect(
      screen
        .getByRole("tab", { name: /Suspendidos/ })
        .querySelector("[data-ops-hoy-count]"),
    ).toHaveAttribute("data-empty", "true");
    expect(
      screen
        .getByRole("tab", { name: /Suspendidos/ })
        .querySelector("[data-ops-hoy-count]"),
    ).not.toHaveAttribute("data-count-tone");
  });

  it("loads the queue with static skeleton bars", () => {
    render(
      <div className="platform-ops">
        <OpsHoyQueues
          chips={[{ id: "past_due", label: "Cobro pendiente", count: 0 }]}
          activeQueue="past_due"
          onQueueChange={vi.fn()}
          isLoading
          emptyTitle="Cola vacía"
          emptyDescription="Nada"
        >
          <p>filas</p>
        </OpsHoyQueues>
      </div>,
    );

    const skeleton = screen.getByTestId("ops-table-skeleton");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton.querySelectorAll(".ops-table-skeleton-bar").length).toBeGreaterThan(0);
    expect(screen.queryByText("filas")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ops-empty-state")).not.toBeInTheDocument();
  });

  it("shows error without empty when both would otherwise apply", () => {
    render(
      <div className="platform-ops">
        <OpsHoyQueues
          chips={[{ id: "past_due", label: "Cobro pendiente", count: 0 }]}
          activeQueue="past_due"
          onQueueChange={vi.fn()}
          isEmpty
          emptyTitle="Cola vacía"
          emptyDescription="Nada"
          error={{
            title: "No se pudo cargar Hoy",
            description: "Intenta de nuevo.",
            retryLabel: "Reintentar",
            onRetry: vi.fn(),
          }}
        >
          <p>filas</p>
        </OpsHoyQueues>
      </div>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar Hoy");
    expect(screen.queryByTestId("ops-hoy-empty")).not.toBeInTheDocument();
    expect(screen.queryByText("filas")).not.toBeInTheDocument();
  });
});
