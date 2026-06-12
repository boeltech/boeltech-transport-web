import * as React from "react";
import { Input } from "@shared/ui/input";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

export interface MoneyInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "type" | "value" | "onChange" | "inputMode"
  > {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  currencyCode?: string;
  locale?: string;
  decimals?: number;
  allowNegative?: boolean;
}

function formatMoneyValue(
  value: number,
  locale: string,
  currencyCode: string,
  decimals: number,
): string {
  if (locale === "es-MX" && currencyCode === "MXN" && decimals === 2) {
    return formatMxCurrency(value);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function toEditableValue(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.?0+$/, "");
}

function sanitizeMoneyInput(raw: string, allowNegative: boolean): string {
  const normalized = raw.replace(",", ".");
  let next = normalized.replace(/[^\d.-]/g, "");

  const minusIndex = next.indexOf("-");
  if (!allowNegative) {
    next = next.replace(/-/g, "");
  } else if (minusIndex > 0) {
    next = next.replace(/-/g, "");
    next = `-${next}`;
  } else if (minusIndex === 0) {
    next = `-${next.slice(1).replace(/-/g, "")}`;
  }

  const dotIndex = next.indexOf(".");
  if (dotIndex >= 0) {
    next = `${next.slice(0, dotIndex + 1)}${next
      .slice(dotIndex + 1)
      .replace(/\./g, "")}`;
  }

  return next;
}

function parseMoneyInput(raw: string): number | undefined {
  if (!raw || raw === "-" || raw === "." || raw === "-.") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onValueChange,
      currencyCode = "MXN",
      locale = "es-MX",
      decimals = 2,
      allowNegative = false,
      className,
      onBlur,
      onFocus,
      onKeyDown,
      placeholder = "$0.00",
      disabled,
      readOnly,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState("");

    React.useEffect(() => {
      if (isFocused) return;
      if (value == null) {
        setDisplayValue("");
        return;
      }
      setDisplayValue(formatMoneyValue(value, locale, currencyCode, decimals));
    }, [value, locale, currencyCode, decimals, isFocused]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeMoneyInput(event.target.value, allowNegative);
      setDisplayValue(sanitized);
      onValueChange?.(parseMoneyInput(sanitized));
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (value != null) {
        setDisplayValue(toEditableValue(value, decimals));
      }
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const parsed = parseMoneyInput(displayValue);
      if (parsed == null) {
        setDisplayValue("");
      } else {
        setDisplayValue(formatMoneyValue(parsed, locale, currencyCode, decimals));
      }
      onBlur?.(event);
    };

    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-muted-foreground">
          {currencyCode}
        </span>
        <Input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={cn("pl-14 text-right tabular-nums", className)}
        />
      </div>
    );
  },
);

MoneyInput.displayName = "MoneyInput";
