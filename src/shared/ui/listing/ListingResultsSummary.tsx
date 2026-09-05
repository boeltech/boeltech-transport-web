interface ListingResultsSummaryProps {
  entityLabelPlural: string;
  total?: number;
  page?: number;
  limit?: number;
}

export function ListingResultsSummary({
  entityLabelPlural,
  total = 0,
  page = 1,
  limit = 20,
}: ListingResultsSummaryProps) {
  const safeTotal = typeof total === "number" && !Number.isNaN(total) ? Math.max(0, total) : 0;
  const safePage = typeof page === "number" && !Number.isNaN(page) ? Math.max(1, page) : 1;
  const safeLimit = typeof limit === "number" && !Number.isNaN(limit) ? Math.max(1, limit) : 20;

  return (
    <div className="text-sm text-muted-foreground">
      {safeTotal === 0 ? (
        `No se encontraron ${entityLabelPlural}`
      ) : (
        <>
          Mostrando{" "}
          <span className="font-medium">
            {(safePage - 1) * safeLimit + 1}-{Math.min(safePage * safeLimit, safeTotal)}
          </span>{" "}
          de <span className="font-medium">{safeTotal}</span> {entityLabelPlural}
        </>
      )}
    </div>
  );
}
