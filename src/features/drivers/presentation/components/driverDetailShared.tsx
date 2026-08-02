import { Badge } from "@shared/ui/badge";
import { driversCopy } from "../copy";

const copy = driversCopy.detail;

export function getExpirationStatus(days: number | null): {
  variant: "default" | "secondary" | "destructive" | "warning";
  tone?: "soft";
  label: string;
} {
  if (days === null) {
    return { variant: "secondary", label: copy.vigency.noDate };
  }
  if (days <= 0) {
    return {
      variant: "destructive",
      tone: "soft",
      label: copy.vigency.expired,
    };
  }
  if (days <= 30) {
    return {
      variant: "warning",
      tone: "soft",
      label: copy.vigency.daysRemaining(days),
    };
  }
  return { variant: "default", label: copy.vigency.valid };
}

interface ResultBadgeProps {
  result: string | null;
  labels: Record<string, string>;
  colors: Record<string, string>;
}

export function DriverResultBadge({
  result,
  labels,
  colors,
}: ResultBadgeProps) {
  if (!result) {
    return <span className="text-muted-foreground">{copy.hint.empty}</span>;
  }

  const label = labels[result] || result;
  const colorClass = colors[result] || "secondary";

  const variantMap: Record<
    string,
    "default" | "secondary" | "destructive" | "warning" | "success"
  > = {
    success: "success",
    warning: "warning",
    destructive: "destructive",
    secondary: "secondary",
  };

  const variant = variantMap[colorClass] || "secondary";
  const tone =
    variant === "success" || variant === "warning" || variant === "destructive"
      ? "soft"
      : undefined;

  return (
    <Badge variant={variant} tone={tone}>
      {label}
    </Badge>
  );
}
