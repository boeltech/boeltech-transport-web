/**
 * ListingResultsFrame — card T1 + pie T8 canónicos para listados Operate.
 *
 * Una card (`rounded-xl border bg-card shadow-sm`) con children (tabla / skeleton /
 * EmptyState) y pie opcional (summary + pagination embedded). El pie solo aparece
 * si hay `pagination` y `total > 0`. Controles de página solo si `totalPages > 1`
 * y hay `onPageChange`.
 *
 * Workbench list-like: la feature compone este frame en `renderContent` —
 * no wrap automático del shell.
 */

import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";
import { ListingPagination } from "./ListingPagination";
import { ListingResultsSummary } from "./ListingResultsSummary";

export type ListingResultsFramePagination = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

export type ListingResultsFrameProps = {
  children: ReactNode;
  entityLabelPlural: string;
  /**
   * Si falta o total === 0 → sin pie.
   * Summary si total > 0. Controles embedded solo si totalPages > 1 y hay onPageChange.
   */
  pagination?: ListingResultsFramePagination;
  onPageChange?: (page: number) => void;
  className?: string;
};

export function ListingResultsFrame({
  children,
  entityLabelPlural,
  pagination,
  onPageChange,
  className,
}: ListingResultsFrameProps) {
  const showFooter = pagination != null && pagination.total > 0;
  const showPaginationControls =
    showFooter &&
    pagination.totalPages > 1 &&
    typeof onPageChange === "function";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      {children}
      {showFooter ? (
        <div className="flex flex-col gap-3 border-t px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <ListingResultsSummary
            entityLabelPlural={entityLabelPlural}
            total={pagination.total}
            page={pagination.page}
            limit={pagination.limit}
          />
          {showPaginationControls ? (
            <ListingPagination
              embedded
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
