import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { accountCopy } from "../accountCopy";
import { PasswordChangeSection } from "./PasswordChangeSection";

const changePassword = vi.fn();
const applySessionTokens = vi.fn();

vi.mock("@features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/auth")>();
  return {
    ...actual,
    useAuth: () => ({
      user: { id: "user-1" },
      applySessionTokens,
    }),
    useChangePassword: () => ({
      changePassword,
      isPending: false,
      reset: vi.fn(),
    }),
  };
});

vi.mock("@shared/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("PasswordChangeSection", () => {
  beforeEach(() => {
    changePassword.mockReset();
    applySessionTokens.mockReset();
    changePassword.mockResolvedValue({
      accessToken: "a",
      refreshToken: "r",
    });
  });

  it("invalida sesiones con SessK tras cambiar contraseña (H-U10-Q01)", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <PasswordChangeSection />
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: accountCopy.password.changeCta }),
    );

    await user.type(
      screen.getByLabelText(accountCopy.password.current),
      "OldPass1",
    );
    await user.type(
      screen.getByLabelText(accountCopy.password.newPassword),
      "NewPass1a",
    );
    await user.type(
      screen.getByLabelText(accountCopy.password.confirm),
      "NewPass1a",
    );
    await user.click(
      screen.getByRole("button", { name: accountCopy.password.save }),
    );

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalled();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["auth", "sessions"],
    });
  });
});
