/**
 * TotpSetupQr — client QR from otpauth URL.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TotpSetupQr } from "./TotpSetupQr";

const mockToDataURL = vi.fn();

vi.mock("qrcode", () => ({
  default: {
    toDataURL: (...args: unknown[]) => mockToDataURL(...args),
  },
}));

describe("TotpSetupQr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders QR image when generation succeeds", async () => {
    mockToDataURL.mockResolvedValue(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    );

    render(
      <TotpSetupQr
        otpauthUrl="otpauth://totp/Boeltech:admin@test.com?secret=JBSWY3DPEHPK3PXP"
        alt="Código QR de prueba"
        errorMessage="Error de QR"
      />,
    );

    expect(
      screen.getByLabelText(/generando código qr/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: /código qr de prueba/i }),
      ).toBeInTheDocument();
    });

    expect(mockToDataURL).toHaveBeenCalledWith(
      "otpauth://totp/Boeltech:admin@test.com?secret=JBSWY3DPEHPK3PXP",
      expect.objectContaining({
        errorCorrectionLevel: "M",
        margin: 2,
      }),
    );
  });

  it("shows fallback message when generation fails", async () => {
    mockToDataURL.mockRejectedValue(new Error("canvas unavailable"));

    render(
      <TotpSetupQr
        otpauthUrl="otpauth://totp/fail"
        alt="QR"
        errorMessage="No se pudo mostrar el código QR"
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no se pudo mostrar el código qr/i),
      ).toBeInTheDocument();
    });
  });
});
