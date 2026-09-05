import { Button } from "@shared/ui/button";
import { generatePageNumbers } from "@shared/lib/utils/generatePageNumbers";

interface ListingPaginationProps {
  page?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
}

export function ListingPagination({
  page = 1,
  totalPages = 1,
  onPageChange,
}: ListingPaginationProps) {
  const safePage = typeof page === "number" && !Number.isNaN(page) ? Math.max(1, page) : 1;
  const safeTotalPages =
    typeof totalPages === "number" && !Number.isNaN(totalPages) ? Math.max(1, totalPages) : 1;

  if (safeTotalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Página {safePage} de {safeTotalPages}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
        >
          Primera
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Anterior
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {generatePageNumbers(safePage, safeTotalPages).map((pageNum, idx) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={safePage === pageNum ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => onPageChange(pageNum as number)}
              >
                {pageNum}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Siguiente
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safeTotalPages)}
        >
          Última
        </Button>
      </div>
    </div>
  );
}
