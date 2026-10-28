import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlatformTenantStatus } from "../../domain/entities";
import { SuspendTenantDialog } from "./SuspendTenantDialog";
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
  props?: Partial<Parameters<typeof SuspendTenantDialog>[0]>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SuspendTenantDialog
        open
        onOpenChange={vi.fn()}
        tenant={{ id: "t1", name: "Acme Transportes", subdomain: "acme-mx" }}
        targetStatus={PlatformTenantStatus.SUSPENDED}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("SuspendTenantDialog", () => {
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

  it("blocks submit when typed confirmation does not match", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByLabelText(copy.confirmationLabel),
      "nombre-incorrecto",
    );
    await user.click(
      screen.getByRole("button", { name: copy.confirmSuspend }),
    );

    // Summary + FieldInlineError both surface the same copy (expected UX).
    await waitFor(() => {
      expect(
        document.getElementById("suspend-confirmation-error"),
      ).toHaveTextContent(copy.confirmationMismatch);
    });
    expect(
      screen.getAllByText(copy.confirmationMismatch).length,
    ).toBeGreaterThanOrEqual(1);
    expect(mockedApi.updateTenantStatus).not.toHaveBeenCalled();
  });

  it("submits reason_code when confirmation matches subdomain", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    await user.type(screen.getByLabelText(copy.confirmationLabel), "acme-mx");
    await user.click(
      screen.getByRole("button", { name: copy.confirmSuspend }),
    );

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
