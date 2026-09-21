import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { emailVerificationBannerCopy as copy } from "./emailVerificationBannerCopy";

const refreshProfile = vi.fn();
const resendEmailVerification = vi.fn();
const mockToastSuccess = vi.fn();

type BannerUser = {
  email: string;
  emailVerifiedAt: Date | string | null | undefined;
};

let authUser: BannerUser | null;

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: authUser,
    refreshProfile: (...args: unknown[]) => refreshProfile(...args),
  }),
}));

vi.mock("@features/auth/infrastructure", () => ({
  authApi: {
    resendEmailVerification: (...args: unknown[]) =>
      resendEmailVerification(...args),
  },
}));

vi.mock("@shared/hooks/useToast", () => ({
  toastSuccess: (...args: unknown[]) => mockToastSuccess(...args),
}));

import { EmailVerificationBanner } from "./EmailVerificationBanner";

const PENDING_USER: BannerUser = {
  email: "ops@acme.test",
  emailVerifiedAt: null,
};

const VERIFIED_USER: BannerUser = {
  email: "ops@acme.test",
  emailVerifiedAt: new Date("2026-09-19T12:00:00.000Z"),
};

describe("EmailVerificationBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = { ...PENDING_USER };
    refreshProfile.mockResolvedValue(PENDING_USER);
    resendEmailVerification.mockResolvedValue({});
  });

  it("renders honest pending copy without claiming a prior send", () => {
    render(<EmailVerificationBanner />);

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body(PENDING_USER.email))).toBeInTheDocument();
    expect(screen.queryByText(/Enviamos un enlace/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/antes de completar el onboarding/i),
    ).not.toBeInTheDocument();
  });

  it("shows still-pending feedback when Ya verifiqué refreshes and email stays null", async () => {
    const user = userEvent.setup();
    refreshProfile.mockImplementation(async () => {
      authUser = { ...PENDING_USER };
      return authUser;
    });

    render(<EmailVerificationBanner />);
    await user.click(
      screen.getByRole("button", { name: copy.confirmButton }),
    );

    await waitFor(() => {
      expect(screen.getByText(copy.stillPending)).toBeInTheDocument();
    });
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
  });

  it("toasts and unmounts when Ya verifiqué finds emailVerifiedAt set", async () => {
    const user = userEvent.setup();
    refreshProfile.mockImplementation(async () => {
      authUser = { ...VERIFIED_USER };
      return authUser;
    });

    render(<EmailVerificationBanner />);
    await user.click(
      screen.getByRole("button", { name: copy.confirmButton }),
    );

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(copy.verifiedToast);
    });
    await waitFor(() => {
      expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
    });
  });

  it("uses post-resend copy after Reenviar correo", async () => {
    const user = userEvent.setup();
    resendEmailVerification.mockResolvedValue({});

    render(<EmailVerificationBanner />);
    await user.click(screen.getByRole("button", { name: copy.resendButton }));

    await waitFor(() => {
      expect(screen.getByText(copy.resendSuccessDefault)).toBeInTheDocument();
    });
    expect(resendEmailVerification).toHaveBeenCalledTimes(1);
  });

  it("shows loading label on Ya verifiqué while refresh is in flight", async () => {
    const user = userEvent.setup();
    let resolveRefresh!: (value: BannerUser) => void;
    refreshProfile.mockImplementation(
      () =>
        new Promise<BannerUser>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    render(<EmailVerificationBanner />);
    await user.click(
      screen.getByRole("button", { name: copy.confirmButton }),
    );

    expect(
      screen.getByRole("button", { name: copy.confirmChecking }),
    ).toBeDisabled();

    resolveRefresh({ ...PENDING_USER });
    await waitFor(() => {
      expect(screen.getByText(copy.stillPending)).toBeInTheDocument();
    });
  });
});
