import { Mail } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { billingCopy } from "../copy/billingCopy";

export function BillingContactCard() {
  const copy = billingCopy.contact;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium">{copy.title}</p>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <a href={`mailto:${copy.email}`}>
            <Mail className="mr-2 h-4 w-4" />
            {copy.cta}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
