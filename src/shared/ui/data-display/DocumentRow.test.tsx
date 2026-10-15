import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentRow } from "./DocumentRow";

/**
 * Alta progresiva de unidades: la vigencia es opcional al guardar, pero su
 * ausencia bloquea la asignación. La fila la señala en vez de ocultar el badge.
 */
describe("DocumentRow — folio y vigencia incompletos", () => {
  it("folio sin fecha → badge «Sin fecha de vencimiento»", () => {
    render(
      <DocumentRow
        label="Póliza RC"
        documentNumber="POL-123"
        expirationDate={null}
      />,
    );

    expect(screen.getByText("POL-123")).toBeInTheDocument();
    expect(screen.getByText("Sin fecha de vencimiento")).toBeInTheDocument();
    expect(screen.queryByText("No registrado")).not.toBeInTheDocument();
    expect(screen.queryByText("Vigente")).not.toBeInTheDocument();
  });

  it("sin folio ni fecha → «No registrado» sin badge", () => {
    render(
      <DocumentRow
        label="Póliza RC"
        documentNumber={null}
        expirationDate={null}
      />,
    );

    expect(screen.getByText("No registrado")).toBeInTheDocument();
    expect(
      screen.queryByText("Sin fecha de vencimiento"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Vigente")).not.toBeInTheDocument();
    expect(screen.queryByText("Vencido")).not.toBeInTheDocument();
  });

  it("folio en blanco cuenta como no registrado", () => {
    render(
      <DocumentRow label="Póliza RC" documentNumber="   " expirationDate={null} />,
    );

    expect(
      screen.queryByText("Sin fecha de vencimiento"),
    ).not.toBeInTheDocument();
  });

  it("con fecha vencida conserva el badge «Vencido»", () => {
    render(
      <DocumentRow
        label="Póliza RC"
        documentNumber="POL-123"
        expirationDate="2020-01-01"
      />,
    );

    expect(screen.getByText("Vencido")).toBeInTheDocument();
    expect(
      screen.queryByText("Sin fecha de vencimiento"),
    ).not.toBeInTheDocument();
  });

  it("con fecha lejana conserva el badge «Vigente»", () => {
    render(
      <DocumentRow
        label="Póliza RC"
        documentNumber="POL-123"
        expirationDate="2099-01-01"
      />,
    );

    expect(screen.getByText("Vigente")).toBeInTheDocument();
  });

  it("permite personalizar los textos de faltante", () => {
    const { rerender } = render(
      <DocumentRow
        label="Licencia"
        documentNumber="LIC-1"
        expirationDate={null}
        noExpirationLabel="Sin fecha"
      />,
    );
    expect(screen.getByText("Sin fecha")).toBeInTheDocument();

    rerender(
      <DocumentRow
        label="Licencia"
        documentNumber={null}
        expirationDate={null}
        emptyLabel="Sin capturar"
      />,
    );
    expect(screen.getByText("Sin capturar")).toBeInTheDocument();
  });
});
