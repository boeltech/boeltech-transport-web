import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { CloneTripSheet } from "./CloneTripSheet";
import { cloneTripCopy } from "../copy/cloneTripCopy";

const mockMutateAsync = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("@shared/hooks")>(
    "@shared/hooks",
  );
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

vi.mock("@features/trips/application", () => ({
  useCloneTrip: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

function renderSheet(open = true) {
  const onOpenChange = vi.fn();
  render(
    <MemoryRouter>
      <CloneTripSheet
        tripId="src-trip-1"
        tripCode="TR-001"
        open={open}
        onOpenChange={onOpenChange}
      />
    </MemoryRouter>,
  );
  return { onOpenChange };
}

async function fillScheduleAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  const form = document.getElementById("clone-trip-form");
  expect(form).toBeTruthy();
  const todayButtons = within(form as HTMLElement).getAllByRole("button", {
    name: cloneTripCopy.preset.todayAtEight,
  });
  const tomorrowButtons = within(form as HTMLElement).getAllByRole("button", {
    name: cloneTripCopy.preset.tomorrowAtEight,
  });

  await user.click(todayButtons[0]!);
  await user.click(tomorrowButtons[1] ?? tomorrowButtons[0]!);
  await user.click(
    screen.getByRole("button", { name: cloneTripCopy.action.submit }),
  );
}

describe("CloneTripSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({
      trip: { id: "new-trip-9" },
      summary: {
        tripId: "new-trip-9",
        tripCode: "TR-009",
        stopsCreated: 2,
        cargosCreated: 1,
        expensesCreated: 0,
        finalStatus: "draft",
      },
    });
  });

  it("shows title and required schedule fields when open", () => {
    renderSheet(true);
    expect(
      screen.getByRole("heading", { name: cloneTripCopy.sheet.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(cloneTripCopy.sheet.description("TR-001")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(cloneTripCopy.label.scheduledDeparture),
    ).toBeInTheDocument();
    expect(
      screen.getByText(cloneTripCopy.label.scheduledArrival),
    ).toBeInTheDocument();
  });

  it("requires both dates before submitting", async () => {
    const user = userEvent.setup();
    renderSheet(true);

    await user.click(
      screen.getByRole("button", { name: cloneTripCopy.action.submit }),
    );

    expect(mockMutateAsync).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getAllByText(cloneTripCopy.validation.departureRequired).length,
      ).toBeGreaterThan(0);
    });
  });

  it("clones, toasts success and navigates to the new trip", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderSheet(true);

    await fillScheduleAndSubmit(user);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    const call = mockMutateAsync.mock.calls[0]?.[0] as {
      sourceTripId: string;
      input: { scheduledDeparture: string; scheduledArrival: string };
    };
    expect(call.sourceTripId).toBe("src-trip-1");
    expect(call.input.scheduledDeparture).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(call.input.scheduledArrival).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: cloneTripCopy.toast.successTitle,
        variant: "success",
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith("/trips/new-trip-9");
  });

  it("agrupa N warnings en un solo toast (D6)", async () => {
    mockMutateAsync.mockResolvedValue({
      trip: { id: "new-trip-9" },
      summary: {
        tripId: "new-trip-9",
        tripCode: "TR-009",
        stopsCreated: 2,
        cargosCreated: 1,
        expensesCreated: 0,
        finalStatus: "draft",
      },
      warnings: [
        { code: "overlap_a", message: "Unidad traslapada" },
        { code: "overlap_b", message: "Operador traslapado" },
      ],
    });

    const user = userEvent.setup();
    renderSheet(true);
    await fillScheduleAndSubmit(user);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: cloneTripCopy.toast.successTitle,
          variant: "success",
        }),
      );
    });

    const warningCalls = mockToast.mock.calls.filter(
      (call) => call[0]?.variant === "warning",
    );
    expect(warningCalls).toHaveLength(1);
    expect(warningCalls[0]?.[0]).toEqual(
      expect.objectContaining({
        title: cloneTripCopy.toast.overlapWarningTitle,
        description: "1. Unidad traslapada\n2. Operador traslapado",
        variant: "warning",
      }),
    );
  });

  it("muestra Alert inline ante error de API (D4)", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Fallo de clonación"));

    const user = userEvent.setup();
    renderSheet(true);
    await fillScheduleAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByText("Fallo de clonación")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
