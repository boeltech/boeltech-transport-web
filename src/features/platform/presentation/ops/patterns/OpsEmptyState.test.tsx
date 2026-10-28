import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../opsTokens.css";
import { OpsButton } from "../ui/OpsButton";
import { OpsEmptyState } from "./OpsEmptyState";

function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="platform-ops" data-ops-shell="true">
      {children}
    </div>
  );
}

describe("OpsEmptyState (Ola 5)", () => {
  it("renders empty variant with title and description", () => {
    render(
      <OpsShell>
        <OpsEmptyState
          title="Cola vacía"
          description="No hay empresas en esta cola ahora."
        />
      </OpsShell>,
    );

    const state = screen.getByTestId("ops-empty-state");
    expect(state).toHaveAttribute("data-ops-empty", "empty");
    expect(screen.getByText("Cola vacía")).toBeInTheDocument();
    expect(
      screen.getByText("No hay empresas en esta cola ahora."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("ops-empty-panel")).not.toBeInTheDocument();
    expect(state).not.toHaveClass("text-center");
  });

  it("renders error with action and alert role", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <OpsShell>
        <OpsEmptyState
          variant="error"
          title="No se pudo cargar"
          description="Intenta de nuevo."
          action={
            <OpsButton variant="ghost" size="sm" onClick={onRetry}>
              Reintentar
            </OpsButton>
          }
        />
      </OpsShell>,
    );

    expect(screen.getByTestId("ops-empty-state")).toHaveAttribute(
      "data-ops-empty",
      "error",
    );
    expect(screen.getByTestId("ops-empty-state")).toHaveAttribute(
      "data-ops-tick",
      "danger",
    );
    expect(screen.queryByTestId("ops-empty-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ops-empty-error-panel")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders loading without panel by default", () => {
    render(
      <OpsShell>
        <OpsEmptyState variant="loading" title="Cargando…" />
      </OpsShell>,
    );

    const state = screen.getByTestId("ops-empty-state");
    expect(state).toHaveAttribute("data-ops-empty", "loading");
    expect(state).toHaveAttribute("aria-busy", "true");
    expect(state.className).not.toMatch(/skeleton/);
    expect(screen.queryByTestId("ops-empty-panel")).not.toBeInTheDocument();
  });
});
