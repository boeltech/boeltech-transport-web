import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { platformCopy } from "../copy/platformCopy";
import { PlatformSecurityPage } from "./PlatformSecurityPage";

const { mockUsePlatformAuth, mockGetMfaStatus, mockSetupMfa } = vi.hoisted(
  () => ({
    mockUsePlatformAuth: vi.fn(),
    mockGetMfaStatus: vi.fn(),
    mockSetupMfa: vi.fn(),
  }),
);

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getMfaStatus: (...args: unknown[]) => mockGetMfaStatus(...args),
    setupMfa: (...args: unknown[]) => mockSetupMfa(...args),
    confirmMfa: vi.fn(),
    disableMfa: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PlatformSecurityPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlatformSecurityPage F3 (D11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMfaStatus.mockResolvedValue({
      enabled: false,
      enabledAt: null,
    });
    mockSetupMfa.mockResolvedValue({
      otpauthUrl: "otpauth://totp/Boeltech?secret=ABC",
      secret: "ABCSECRET",
    });
  });

  it("owner sin MFA: DetailAlertCard con job Configurar MFA", async () => {
    const user = userEvent.setup();
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u1",
        email: "owner@test.com",
        firstName: "Owner",
        lastName: "Test",
        platformRole: "platform_owner",
        scope: "platform",
        mfaEnabled: false,
      },
      refreshUser: vi.fn(),
    });

    renderPage();

    expect(
      await screen.findByText(platformCopy.security.mfaRequiredTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.security.mfaRequiredBanner),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: platformCopy.security.setup }),
    );
    expect(mockSetupMfa).toHaveBeenCalled();
    expect(
      await screen.findByText(platformCopy.security.secretHint),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.security.confirm }),
    ).toBeInTheDocument();
  });

  it("MFA activo: pie FormStickyActions no sticky para desactivar", async () => {
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u1",
        email: "owner@test.com",
        firstName: "Owner",
        lastName: "Test",
        platformRole: "platform_owner",
        scope: "platform",
        mfaEnabled: true,
      },
      refreshUser: vi.fn(),
    });
    mockGetMfaStatus.mockResolvedValue({
      enabled: true,
      enabledAt: "2026-10-01T00:00:00.000Z",
    });

    const { container } = renderPage();

    expect(
      await screen.findByRole("button", {
        name: platformCopy.security.disable,
      }),
    ).toBeInTheDocument();
    expect(container.querySelector(".sticky.bottom-0")).toBeNull();
  });
});
