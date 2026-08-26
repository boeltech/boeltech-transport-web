import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import type { ReportsCatalogItemDefinition } from "../config/reportsHubCatalog";
import { reportsCopy } from "../copy/reportsCopy";

interface ReportsCatalogSectionProps {
  title: string;
  description?: string;
  items: readonly ReportsCatalogItemDefinition[];
}

export function ReportsCatalogSection({
  title,
  description,
  items,
}: ReportsCatalogSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby={`reports-catalog-${title}`}>
      <div className="space-y-1">
        <h2
          id={`reports-catalog-${title}`}
          className="text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base leading-snug">
                    {item.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={item.href}>
                    {reportsCopy.catalog.viewAnalysisCta}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
