import { Button } from "@shared/ui/button";
import { generatePageNumbers } from "@shared/lib/utils/generatePageNumbers";

interface ListingPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ListingPagination({
  page,
  totalPages,
  onPageChange,
}: ListingPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          Primera
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {generatePageNumbers(page, totalPages).map((pageNum, idx) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-2">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
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
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          Última
        </Button>
      </div>
    </div>
  );
}
