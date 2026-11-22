/**
 * Código TOTP / recovery en 6 casillas (MC9 · Operate-MiCuenta-DosPasos).
 * Contrato API intacto: emite un string de dígitos.
 */

import {
  useCallback,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Input } from "@shared/ui/input";
import { cn } from "@shared/lib/utils/cn";

const LENGTH = 6;

export interface OtpSixDigitInputProps {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
  className?: string;
}

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, LENGTH);
}

export function OtpSixDigitInput({
  id = "otp-six",
  value,
  onChange,
  disabled,
  autoFocus,
  "aria-label": ariaLabel = "Código de 6 dígitos",
  className,
}: OtpSixDigitInputProps) {
  const digits = onlyDigits(value).padEnd(LENGTH, " ").slice(0, LENGTH).split("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const emit = useCallback(
    (cells: string[]) => {
      onChange(cells.join("").replace(/\s/g, ""));
    },
    [onChange],
  );

  const focusAt = (index: number) => {
    const el = refs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = onlyDigits(raw);
    if (!cleaned) {
      const next = [...digits.map((d) => (d === " " ? "" : d))];
      next[index] = "";
      emit(next);
      return;
    }
    const next = [...digits.map((d) => (d === " " ? "" : d))];
    if (cleaned.length === 1) {
      next[index] = cleaned;
      emit(next);
      if (index < LENGTH - 1) focusAt(index + 1);
      return;
    }
    // Paste into a single box or multi-char input
    for (let i = 0; i < cleaned.length && index + i < LENGTH; i += 1) {
      next[index + i] = cleaned[i]!;
    }
    emit(next);
    focusAt(Math.min(index + cleaned.length, LENGTH - 1));
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const current = digits[index]?.trim() ?? "";
      if (!current && index > 0) {
        e.preventDefault();
        const next = [...digits.map((d) => (d === " " ? "" : d))];
        next[index - 1] = "";
        emit(next);
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = onlyDigits(e.clipboardData.getData("text"));
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: LENGTH }, (_, i) => pasted[i] ?? "");
    emit(next);
    focusAt(Math.min(pasted.length, LENGTH) - 1);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex gap-1.5", className)}
    >
      {Array.from({ length: LENGTH }, (_, index) => {
        const cell = digits[index]?.trim() ?? "";
        return (
          <Input
            key={index}
            id={index === 0 ? id : undefined}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={LENGTH}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            value={cell}
            aria-label={`Dígito ${index + 1} de ${LENGTH}`}
            className="h-11 w-10 px-0 text-center font-mono text-base tabular-nums"
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
          />
        );
      })}
    </div>
  );
}
