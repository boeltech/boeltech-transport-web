/**
 * RoleBadge Component
 *
 * Displays a user's role as a styled badge with icon.
 * Uses shadcn/ui Badge component.
 */

import { Badge } from "@/shared/ui/badge";
import {
  Shield,
  Briefcase,
  Calculator,
  ClipboardList,
  User,
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
  accountant: Calculator,
  operator: ClipboardList,
  client: User,
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  manager:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  accountant:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  operator: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  client: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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
  const colorClass = ROLE_COLORS[role];
  const sizeClass = SIZE_CLASSES[size];
  const iconSize = ICON_SIZES[size];

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} ${sizeClass} ${className} inline-flex items-center gap-1.5`}
    >
      {showIcon && <Icon size={iconSize} />}
      <span>{label}</span>
    </Badge>
  );
}

/**
 * Example Usage:
 *
 * import { RoleBadge } from '@/shared/components/RoleBadge';
 *
 * function UserCard({ user }) {
 *   return (
 *     <div>
 *       <h3>{user.name}</h3>
 *       <RoleBadge role={user.role} />
 *     </div>
 *   );
 * }
 *
 * // Without icon
 * <RoleBadge role="admin" showIcon={false} />
 *
 * // Large size
 * <RoleBadge role="manager" size="lg" />
 *
 * // Small size for tables
 * <RoleBadge role="operator" size="sm" />
 */
