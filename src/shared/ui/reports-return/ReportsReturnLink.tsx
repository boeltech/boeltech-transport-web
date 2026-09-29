import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  REPORTS_WAYFINDING_COPY,
  useReportsReturnHref,
} from "@shared/utils/reportsWayfinding";

/** Chevron de vuelta al hub /reports cuando se llegó desde el catálogo. */
export function ReportsReturnLink() {
  const href = useReportsReturnHref();
  if (!href) return null;

  return (
    <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" asChild>
      <Link to={href}>
        <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
        {REPORTS_WAYFINDING_COPY.backToReports}
      </Link>
    </Button>
  );
}
