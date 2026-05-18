/**
 * RoleBadge Component
 *
 * Displays a user's role as a styled badge with icon.
 * Uses shadcn/ui Badge component.
 */

import { Badge } from "@/shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import {
  Shield,
  Briefcase,
  Calculator,
  ClipboardList,
  User,
  Radio,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { ROLE_LABELS, type UserRole } from "@/shared/constants/roles";

interface RoleBadgeProps {
  role: UserRole;
  /** Show icon alongside label */
  showIcon?: boolean;
  /** Badge size variant */
  size?: "sm" | "default" | "lg";
  /** Custom className */
  className?: string;
}

const ROLE_ICONS: Record<UserRole, LucideIcon> = {
  admin: Shield,
  manager: Briefcase,
  dispatcher: Radio,
  accountant: Calculator,
  operator: ClipboardList,
  driver: Truck,
  client: User,
};

type RoleBadgeStyle = {
  variant: "destructive" | "warning" | "info" | "success" | "neutral";
  tone?: "soft" | "solid";
};

const ROLE_BADGE_STYLE: Record<UserRole, RoleBadgeStyle> = {
  admin: { variant: "destructive", tone: "soft" },
  manager: { variant: "warning", tone: "soft" },
  dispatcher: { variant: "info", tone: "solid" },
  accountant: { variant: "warning", tone: "soft" },
  operator: { variant: "success", tone: "soft" },
  driver: { variant: "neutral", tone: "soft" },
  client: { variant: "info", tone: "soft" },
};

const SIZE_CLASSES = {
  sm: "px-1.5 py-0.5 text-xs",
  default: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
};

const ICON_SIZES = {
  sm: 12,
  default: 14,
  lg: 16,
};

export function RoleBadge({
  role,
  showIcon = true,
  size = "default",
  className = "",
}: RoleBadgeProps) {
  const Icon = ROLE_ICONS[role];
  const label = ROLE_LABELS[role];
  const { variant, tone } = ROLE_BADGE_STYLE[role];
  const sizeClass = SIZE_CLASSES[size];
  const iconSize = ICON_SIZES[size];

  return (
    <Badge
      variant={variant}
      tone={tone}
      className={cn(
        "inline-flex items-center gap-1.5 border-transparent",
        sizeClass,
        className,
      )}
    >
      {showIcon && <Icon size={iconSize} />}
      <span>{label}</span>
    </Badge>
  );
}
