import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripDetailCopy } from "../copy";
import type { LinkedTripInvoiceDraft } from "../helpers/listLinkedTripInvoiceDrafts";
import { TripLinkedInvoiceDraftsSheet } from "./TripLinkedInvoiceDraftsSheet";

const copy = tripDetailCopy.shell.linkedDraftsSheet;

const drafts: LinkedTripInvoiceDraft[] = [
  { id: "inv-flete", source: "principal", folio: "F-100" },
  { id: "inv-acc", source: "accessory", folio: null },
];

describe("TripLinkedInvoiceDraftsSheet (F9b / D18′)", () => {
  it("muestra título, ayuda y N filas sin navegar al abrir", () => {
    const onSelectDraft = vi.fn();
    render(
      <TripLinkedInvoiceDraftsSheet
        open
        onOpenChange={vi.fn()}
        drafts={drafts}
        onSelectDraft={onSelectDraft}
      />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.rowPrincipal)).toBeInTheDocument();
    expect(screen.getByText("F-100")).toBeInTheDocument();
    expect(screen.getByText(copy.rowAccessory)).toBeInTheDocument();
    expect(onSelectDraft).not.toHaveBeenCalled();
  });

  it("click en fila llama onSelectDraft con ese id y cierra", async () => {
    const user = userEvent.setup();
    const onSelectDraft = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TripLinkedInvoiceDraftsSheet
        open
        onOpenChange={onOpenChange}
        drafts={drafts}
        onSelectDraft={onSelectDraft}
      />,
    );

    await user.click(screen.getByTestId("trip-linked-draft-row-inv-acc"));

    expect(onSelectDraft).toHaveBeenCalledWith("inv-acc");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Cerrar dismissible sin seleccionar", async () => {
    const user = userEvent.setup();
    const onSelectDraft = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TripLinkedInvoiceDraftsSheet
        open
        onOpenChange={onOpenChange}
        drafts={drafts}
        onSelectDraft={onSelectDraft}
      />,
    );

    await user.click(screen.getByTestId("trip-linked-drafts-sheet-close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSelectDraft).not.toHaveBeenCalled();
  });
});
