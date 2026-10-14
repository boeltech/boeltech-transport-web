import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CreateTicketSheet } from "./CreateTicketSheet";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.createTicket;

const mockMutateAsync = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockOnOpenChange = vi.fn();

vi.mock("../../application", () => ({
  useCreateHelpTicket: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@shared/hooks/useToast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

vi.mock("../../application/trackHelpEvent", () => ({
  trackHelpEvent: vi.fn(),
}));

vi.mock("../../infrastructure/helpSessionFlags", () => ({
  hasHelpArticleViewed: () => false,
}));

function renderSheet(open = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CreateTicketSheet
        open={open}
        onOpenChange={mockOnOpenChange}
        route="/trips"
        tenantName="Acme"
      />
    </QueryClientProvider>,
  );
}

describe("CreateTicketSheet (F2 D11)", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockOnOpenChange.mockReset();
  });

  it("muestra FieldInlineError en body al enviar corto", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.type(screen.getByLabelText(/Descripción/i), "corto");
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(await screen.findByText(copy.bodyMinChars)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("muestra FieldInlineError en archivo inválido", () => {
    renderSheet();

    const input = document.getElementById(
      "ticket-attachment",
    ) as HTMLInputElement;
    const badFile = new File(["x"], "notes.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [badFile] } });

    expect(screen.getByText(copy.attachmentInvalidType)).toBeInTheDocument();
  });

  it("toast de éxito y cierra el sheet", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      id: "tk-1",
      message: "Ticket creado",
    });
    renderSheet();

    await user.type(
      screen.getByLabelText(/Descripción/i),
      "Necesito ayuda con el viaje",
    );
    await user.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Ticket creado");
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("toast de error si falla la mutación", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error("fail"));
    renderSheet();

    await user.type(
      screen.getByLabelText(/Descripción/i),
      "Necesito ayuda con el viaje",
    );
    await user.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(copy.errorCreate);
    });
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });
});
