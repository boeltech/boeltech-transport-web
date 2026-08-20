import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { TripStatus } from "@features/trips/domain";
import { TooltipProvider } from "@shared/ui/tooltip";
import { tripDetailCopy } from "../../copy";
import {
  TripConfirmReserveButton,
  type TripConfirmReserveButtonProps,
} from "./TripConfirmReserveButton";

const mutate = vi.fn();
const mutateAsyncUpdate = vi.fn();
const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/trips/application", () => ({
  useScheduleTrip: () => ({
    mutate,
    isPending: false,
  }),
  useUpdateTrip: () => ({
    mutateAsync: mutateAsyncUpdate,
    isPending: false,
  }),
}));

vi.mock("@features/clients/application", () => ({
  useClientCreditSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

const copy = tripDetailCopy.shell;

function renderButton(props?: Partial<TripConfirmReserveButtonProps>) {
  return render(
    <MemoryRouter>
      <TooltipProvider delayDuration={0}>
        <TripConfirmReserveButton
          tripId="trip-1"
          tripCode="TR-001"
          status={TripStatus.DRAFT}
          clientId="cli-1"
          prospectiveAmount={1200}
          startMileage={1200}
          scheduledArrival={new Date("2030-01-16T18:00:00.000Z")}
          {...props}
        />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("TripConfirmReserveButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("renders the header confirm CTA in draft", () => {
    renderButton();
    expect(
      screen.getByRole("button", { name: copy.action.confirmReserve }),
    ).toBeInTheDocument();
  });

  it("confirms without requiring cargos or CP31 fields", async () => {
    const user = userEvent.setup();
    renderButton();

    await user.click(
      screen.getByRole("button", { name: copy.action.confirmReserve }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.queryByLabelText(/RFC/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/mercanc/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.action.confirm }),
    );
    expect(mutate).toHaveBeenCalledWith("trip-1");
    expect(mutateAsyncUpdate).not.toHaveBeenCalled();
  });

  it("does not ask for mileage again when startMileage is 0", async () => {
    const user = userEvent.setup();
    renderButton({ startMileage: 0 });

    await user.click(
      screen.getByRole("button", { name: copy.action.confirmReserve }),
    );

    expect(
      screen.queryByRole("spinbutton", { name: /kilometraje inicial/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.action.confirm }),
    );
    expect(mutate).toHaveBeenCalledWith("trip-1");
    expect(mutateAsyncUpdate).not.toHaveBeenCalled();
  });

  it("captures missing start mileage then schedules", async () => {
    const user = userEvent.setup();
    mutateAsyncUpdate.mockResolvedValue({});
    renderButton({ startMileage: null, suggestedStartMileage: 0 });

    await user.click(
      screen.getByRole("button", { name: copy.action.confirmReserve }),
    );

    const mileageField = await screen.findByRole("spinbutton", {
      name: /kilometraje inicial/i,
    });
    expect(mileageField).toHaveValue(0);

    await user.click(
      screen.getByRole("button", { name: copy.action.confirm }),
    );

    await waitFor(() => {
      expect(mutateAsyncUpdate).toHaveBeenCalledWith({
        id: "trip-1",
        data: { startMileage: 0 },
      });
    });
    expect(mutate).toHaveBeenCalledWith("trip-1");
  });

  it("does not render when the trip is not draft", () => {
    renderButton({ status: TripStatus.SCHEDULED });
    expect(
      screen.queryByRole("button", { name: copy.action.confirmReserve }),
    ).not.toBeInTheDocument();
  });

  it("disables confirm when fleet is not ready", () => {
    renderButton({ fleetReady: false });
    expect(
      screen.getByRole("button", {
        name: `${copy.action.confirmReserve}. ${copy.alert.draftConfirmFleetBlocked}`,
      }),
    ).toBeDisabled();
  });

  it("asks for arrival, rate and mileage when they are missing", async () => {
    const user = userEvent.setup();
    mutateAsyncUpdate.mockResolvedValue({});
    renderButton({
      startMileage: null,
      scheduledArrival: null,
      prospectiveAmount: 0,
      suggestedStartMileage: 10,
    });

    await user.click(
      screen.getByRole("button", { name: copy.action.confirmReserve }),
    );

    expect(
      screen.getByText(copy.alert.draftConfirmMissingTitle),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.alert.draftConfirmArrivalLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.alert.draftConfirmRateLabel)).toBeInTheDocument();
    expect(
      screen.getByRole("spinbutton", { name: /kilometraje inicial/i }),
    ).toBeInTheDocument();
  });
});
