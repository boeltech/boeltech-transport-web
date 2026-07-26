/**
 * TotpSetupQr — QR from otpauth URL (client-side, no API change).
 */

import { memo, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";

export interface TotpSetupQrProps {
  otpauthUrl: string;
  /** Accessible label for the QR image. */
  alt: string;
  /** Shown while generating. */
  loadingLabel?: string;
  /** Inline message if generation fails. */
  errorMessage: string;
  className?: string;
  /** Pixel size of the QR canvas (default 200). */
  size?: number;
}

type QrState =
  | { status: "loading" }
  | { status: "ready"; dataUrl: string }
  | { status: "error" };

export const TotpSetupQr = memo(function TotpSetupQr({
  otpauthUrl,
  alt,
  loadingLabel = "Generando código QR…",
  errorMessage,
  className,
  size = 200,
}: TotpSetupQrProps) {
  const [state, setState] = useState<QrState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    void QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: size,
      color: {
        dark: "#0a0a0a",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setState({ status: "ready", dataUrl });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [otpauthUrl, size]);

  if (state.status === "loading") {
    return (
      <div
        className={cn("flex flex-col items-center gap-2", className)}
        aria-busy="true"
        aria-label={loadingLabel}
      >
        <Skeleton
          className="rounded-lg"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p
        className={cn("text-muted-foreground text-center text-sm", className)}
        role="status"
      >
        {errorMessage}
      </p>
    );
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <img
        src={state.dataUrl}
        alt={alt}
        width={size}
        height={size}
        className="rounded-lg border border-border bg-white p-1 shadow-xs"
      />
    </div>
  );
});
