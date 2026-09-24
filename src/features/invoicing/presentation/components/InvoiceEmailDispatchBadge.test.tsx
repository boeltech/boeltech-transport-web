import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { invoicingCopy } from "../copy/invoicingCopy";
import { InvoiceEmailDispatchBadge } from "./InvoiceEmailDispatchBadge";

describe("InvoiceEmailDispatchBadge", () => {
  it("no renderiza fuera de stamped", () => {
    const { container } = render(
      <InvoiceEmailDispatchBadge
        status="draft"
        dispatchSentAt="2026-09-11T12:00:00.000Z"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra No enviada cuando falta dispatchSentAt", () => {
    render(
      <InvoiceEmailDispatchBadge status="stamped" dispatchSentAt={null} />,
    );
    expect(
      screen.getByText(invoicingCopy.send.badgeNotSent),
    ).toBeInTheDocument();
  });

  it("muestra Enviada compacta en listados", () => {
    render(
      <InvoiceEmailDispatchBadge
        status="stamped"
        dispatchSentAt="2026-09-11T12:00:00.000Z"
        mode="compact"
      />,
    );
    expect(screen.getByText(invoicingCopy.send.badgeSent)).toBeInTheDocument();
    expect(
      screen.queryByText(/Enviada ·/i),
    ).not.toBeInTheDocument();
  });

  it("muestra Enviada · fecha en detalle", () => {
    render(
      <InvoiceEmailDispatchBadge
        status="stamped"
        dispatchSentAt="2026-09-11T12:00:00.000Z"
        mode="withDate"
      />,
    );
    expect(screen.getByText(/Enviada ·/i)).toBeInTheDocument();
  });

  it("muestra Envío auto falló cuando lastItemStatus=failed y no hay envío", () => {
    render(
      <InvoiceEmailDispatchBadge
        status="stamped"
        dispatchSentAt={null}
        autoDispatchLastItemStatus="failed"
      />,
    );
    expect(
      screen.getByText(invoicingCopy.send.badgeAutoFail),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(invoicingCopy.send.badgeNotSent),
    ).not.toBeInTheDocument();
  });

  it("prioriza Enviada sobre auto-fail si ya hay dispatchSentAt", () => {
    render(
      <InvoiceEmailDispatchBadge
        status="stamped"
        dispatchSentAt="2026-09-11T12:00:00.000Z"
        autoDispatchLastItemStatus="failed"
      />,
    );
    expect(screen.getByText(invoicingCopy.send.badgeSent)).toBeInTheDocument();
    expect(
      screen.queryByText(invoicingCopy.send.badgeAutoFail),
    ).not.toBeInTheDocument();
  });
});
