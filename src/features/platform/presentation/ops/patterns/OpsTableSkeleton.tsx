const DEFAULT_ROWS = 5;

export interface OpsTableSkeletonProps {
  rows?: number;
}

/**
 * Barras de carga a la altura de la fila. Estáticas: no hay shimmer ni pulse.
 */
export function OpsTableSkeleton({ rows = DEFAULT_ROWS }: OpsTableSkeletonProps) {
  return (
    <div
      className="ops-table-skeleton"
      aria-busy="true"
      data-testid="ops-table-skeleton"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="ops-table-skeleton-bar" />
      ))}
    </div>
  );
}
