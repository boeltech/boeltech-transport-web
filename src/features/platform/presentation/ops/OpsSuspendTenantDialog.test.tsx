import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlatformTenantStatus } from "../../domain/entities";
import { OpsSuspendTenantDialog } from "./OpsSuspendTenantDialog";
import { platformCopy } from "../copy/platformCopy";
import { platformApi } from "../../infrastructure/platformApi";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    updateTenantStatus: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const mockedApi = vi.mocked(platformApi);
const copy = platformCopy.tenants.suspend;

function renderDialog(
  props?: Partial<Parameters<typeof OpsSuspendTenantDialog>[0]>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <div className="platform-ops">
        <OpsSuspendTenantDialog
          open
          onOpenChange={vi.fn()}
          tenant={{ id: "t1", name: "Acme Transportes", subdomain: "acme-mx" }}
          targetStatus={PlatformTenantStatus.SUSPENDED}
          {...props}
        />
      </div>
    </QueryClientProvider>,
  );
}

describe("OpsSuspendTenantDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.updateTenantStatus.mockResolvedValue({
      data: {
        id: "t1",
        name: "Acme Transportes",
        subdomain: "acme-mx",
        status: PlatformTenantStatus.SUSPENDED,
      } as never,
      message: "ok",
    });
  });

  it("uses danger dialog shell for typed suspend", () => {
    renderDialog();
    const dialog = screen.getByTestId("ops-suspend-tenant-dialog");
    expect(dialog).toHaveAttribute("data-tone", "danger");
    const title = screen.getByRole("heading", { name: copy.suspendTitle });
    expect(title).toHaveClass("ops-type-title");
    expect(title).not.toHaveClass("ops-text-danger");
    expect(
      screen.getByRole("button", { name: copy.confirmSuspend }),
    ).toHaveAttribute("data-ops-button", "danger");
  });

  it("keeps the danger button inert until the confirmation matches", () => {
    const user = userEvent.setup();
    renderDialog();

    const confirm = screen.getByRole("button", { name: copy.confirmSuspend });
    expect(confirm).toBeDisabled();
    expect(confirm).not.toHaveAttribute("data-ops-tick");

    return user
      .type(screen.getByLabelText(copy.confirmationLabel), "nombre-incorrecto")
      .then(() => {
        expect(confirm).toBeDisabled();
        expect(mockedApi.updateTenantStatus).not.toHaveBeenCalled();
      });
  });

  it("submits reason_code when confirmation matches subdomain", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    await user.type(screen.getByLabelText(copy.confirmationLabel), "acme-mx");
    const confirm = screen.getByRole("button", { name: copy.confirmSuspend });
    expect(confirm).toBeEnabled();
    expect(confirm).toHaveAttribute("data-ops-tick", "danger");
    await user.click(confirm);

    await waitFor(() => {
      expect(mockedApi.updateTenantStatus).toHaveBeenCalledWith("t1", {
        status: PlatformTenantStatus.SUSPENDED,
        reasonCode: "past_due_policy",
        reasonDetail: undefined,
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
