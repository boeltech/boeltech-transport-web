interface ListingResultsSummaryProps {
  entityLabelPlural: string;
  total: number;
  page: number;
  limit: number;
}

export function ListingResultsSummary({
  entityLabelPlural,
  total,
  page,
  limit,
}: ListingResultsSummaryProps) {
  return (
    <div className="text-sm text-muted-foreground">
      {total === 0 ? (
        `No se encontraron ${entityLabelPlural}`
      ) : (
        <>
          Mostrando{" "}
          <span className="font-medium">
            {(page - 1) * limit + 1}-{Math.min(page * limit, total)}
          </span>{" "}
          de <span className="font-medium">{total}</span> {entityLabelPlural}
        </>
      )}
    </div>
  );
}
