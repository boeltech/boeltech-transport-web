import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailAlertCard } from "./DetailAlertCard";

describe("DetailAlertCard", () => {
  it("renderiza items y el slot action", () => {
    render(
      <DetailAlertCard
        severity="warning"
        title="Documentos por vencer"
        items={[{ label: "Seguro", text: "Vence en 12 días" }]}
        action={<button type="button">Ver documentos</button>}
      />,
    );

    expect(screen.getByText("Documentos por vencer")).toBeInTheDocument();
    expect(screen.getByText(/Seguro/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver documentos" }),
    ).toBeInTheDocument();
  });

  it("acepta cta como alias de action", () => {
    render(
      <DetailAlertCard
        severity="info"
        title="Aviso"
        cta={<button type="button">Ir a editar</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Ir a editar" }),
    ).toBeInTheDocument();
  });

  it("action gana sobre cta si ambos existen", () => {
    render(
      <DetailAlertCard
        severity="info"
        title="Aviso"
        action={<button type="button">Action</button>}
        cta={<button type="button">Cta</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cta" })).not.toBeInTheDocument();
  });
});
