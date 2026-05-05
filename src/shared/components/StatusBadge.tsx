/* eslint-disable react-refresh/only-export-components */
/**
 * StatusBadge
 * Clean Architecture - Shared Layer (Components)
 *
 * Componente genérico para mostrar badges de estado.
 * Usado por todos los módulos para mantener consistencia visual.
 *
 * Ubicación: src/shared/ui/status-badge.tsx
 */

import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import type { StatusConfig } from "@shared/config/status/types";

// ============================================================================
// TYPES
// ============================================================================

interface StatusBadgeProps<T extends string> {
  /** Valor del estado */
  status: T;

  /** Configuración de estados del módulo */
  config: Record<T, StatusConfig>;

  /** Clases CSS adicionales */
  className?: string;

  /** Mostrar ícono junto al texto */
  showIcon?: boolean;

  /** Tamaño del badge */
  size?: "sm" | "md" | "lg";
}

// ============================================================================
// SIZE VARIANTS
// ============================================================================

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-sm px-3 py-1",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function StatusBadge<T extends string>({
  status,
  config,
  className,
  showIcon = false,
  size = "md",
}: StatusBadgeProps<T>) {
  const statusConfig = config[status];

  // Fallback para estados no configurados
  if (!statusConfig) {
    return (
      <Badge variant="outline" className={cn(sizeClasses[size], className)}>
        {status}
      </Badge>
    );
  }

  const Icon = statusConfig.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium inline-flex items-center gap-1.5",
        sizeClasses[size],
        statusConfig.bgColor,
        statusConfig.textColor,
        statusConfig.borderColor,
        className,
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn(iconSizeClasses[size], "shrink-0")} />
      )}
      {statusConfig.label}
    </Badge>
  );
}

// ============================================================================
// CONVENIENCE WRAPPER FACTORY
// ============================================================================

/**
 * Crea un componente StatusBadge tipado para un módulo específico.
 * Evita tener que pasar el config en cada uso.
 *
 * @example
 * // En el módulo de trips
 * export const TripStatusBadge = createStatusBadgeComponent(TRIP_STATUS_CONFIG);
 *
 * // Uso
 * <TripStatusBadge status={trip.status} />
 */
export function createStatusBadgeComponent<T extends string>(
  config: Record<T, StatusConfig>,
) {
  return function ModuleStatusBadge({
    status,
    className,
    showIcon,
    size,
  }: Omit<StatusBadgeProps<T>, "config">) {
    return (
      <StatusBadge
        status={status}
        config={config}
        className={className}
        showIcon={showIcon}
        size={size}
      />
    );
  };
}

// export const TripStatusBadgeAnimated = memo(function TripStatusBadgeAnimated({
//   status,
//   ...props
// }: TripStatusBadgeProps) {
//   return (
//     <div className="relative inline-flex">
//       <TripStatusBadge status={status} {...props} />
//       {status === TripStatus.IN_PROGRESS && (
//         <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
//           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
//           <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
//         </span>
//       )}
//     </div>
//   );
// });
