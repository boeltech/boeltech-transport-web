import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import {
  PendingQueueErrorRow,
  PendingQueueRow,
  PendingQueueRowSkeleton,
} from "./PendingQueueRow";
import { PendingQueueCard } from "./PendingQueueCard";

describe("PendingQueueRow", () => {
  it("renderiza título, área, desglose, valor y CTA como link", () => {
    render(
      <MemoryRouter>
        <PendingQueueRow
          title="Por autorizar"
          area="Aprobaciones"
          breakdown="2 gastos de viaje"
          value={4}
          ctaLabel="Revisar"
          href="/finance/approvals"
          urgency="warning"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Por autorizar")).toBeInTheDocument();
    expect(screen.getByText("Aprobaciones")).toBeInTheDocument();
    expect(screen.getByText("2 gastos de viaje")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Revisar/ })).toHaveAttribute(
      "href",
      "/finance/approvals",
    );
  });
});

describe("PendingQueueErrorRow", () => {
  it("dispara Reintentar sin tumbar el contenedor", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <PendingQueueCard>
        <PendingQueueErrorRow
          title="Viajes con retraso"
          area="Operación"
          onRetry={onRetry}
        />
      </PendingQueueCard>,
    );

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText("No se pudo cargar este conteo.")).toBeInTheDocument();
  });
});

describe("PendingQueueCard", () => {
  it("muestra vacío total y chips Al día", () => {
    const { rerender } = render(
      <PendingQueueCard
        empty={{
          title: "Estás al día",
          description: "No hay nada pendiente en tus bandejas.",
        }}
      >
        <PendingQueueRowSkeleton />
      </PendingQueueCard>,
    );
    expect(screen.getByText("Estás al día")).toBeInTheDocument();
    expect(screen.queryByText("Al día:")).not.toBeInTheDocument();

    rerender(
      <PendingQueueCard clearChips={["Atención fiscal", "Alertas GPS"]}>
        <span>fila</span>
      </PendingQueueCard>,
    );
    expect(screen.getByText("Al día:")).toBeInTheDocument();
    expect(screen.getByText("Atención fiscal")).toBeInTheDocument();
  });
});
