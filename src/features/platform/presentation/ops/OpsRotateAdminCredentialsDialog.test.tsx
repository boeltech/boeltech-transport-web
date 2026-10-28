import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { OpsRotateAdminCredentialsDialog } from "./OpsRotateAdminCredentialsDialog";

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  useRotatePlatformAdminCredentials: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("OpsRotateAdminCredentialsDialog", () => {
  it("renders Ops dialog kit (no ERP Dialog primitives)", () => {
    renderWithTheme(
      <OpsRotateAdminCredentialsDialog
        tenantId="tenant-1"
        open
        onOpenChange={vi.fn()}
      />,
    );

    const dialog = screen.getByTestId("ops-rotate-admin-credentials-dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass("ops-dialog-content");
    expect(
      screen.getByRole("heading", {
        name: /Rotar contraseña del administrador/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nueva contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Reenviar enlace de activación/i,
      }),
    ).toBeChecked();
    expect(
      screen.getByRole("button", { name: /Guardar contraseña/i }),
    ).toBeInTheDocument();
    expect(document.querySelector(".bg-card")).toBeNull();
  });
});
