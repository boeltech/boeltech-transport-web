import { cn } from "@shared/lib/utils/cn";
import {
  PlatformRole,
  type PlatformRoleType,
} from "../../../domain/entities";

export interface OpsOperatorMarkProps {
  role: PlatformRoleType | null | undefined;
}

/**
 * Rol de sesión en mono, junto al nombre. No es botón ni badge.
 * Sin rol conocido, no pinta uno.
 */
export function OpsOperatorMark({ role }: OpsOperatorMarkProps) {
  if (role !== PlatformRole.OWNER && role !== PlatformRole.SUPPORT) {
    return null;
  }

  return (
    <span
      className={cn(
        "ops-font-mono ops-type-caption",
        role === PlatformRole.OWNER ? "ops-text" : "ops-text-muted",
      )}
      data-testid="ops-operator-mark"
      data-ops-role={role}
    >
      {role}
    </span>
  );
}
