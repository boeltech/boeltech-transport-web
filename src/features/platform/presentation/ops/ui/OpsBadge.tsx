import * as React from "react";
import { cn } from "@shared/lib/utils/cn";

export type OpsBadgeTone =
  | "default"
  | "muted"
  | "accent"
  | "ok"
  | "warn"
  | "danger";

export interface OpsBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: OpsBadgeTone;
}

const toneClass: Record<OpsBadgeTone, string> = {
  default: "ops-badge-default",
  muted: "ops-badge-muted",
  accent: "ops-badge-accent",
  ok: "ops-badge-ok",
  warn: "ops-badge-warn",
  danger: "ops-badge-danger",
};

export function OpsBadge({
  className,
  tone = "default",
  ...props
}: OpsBadgeProps) {
  return (
    <span
      className={cn("ops-badge", toneClass[tone], className)}
      data-ops-badge={tone}
      {...props}
    />
  );
}
