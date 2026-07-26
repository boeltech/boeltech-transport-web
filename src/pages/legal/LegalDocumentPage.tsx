import { Link } from "react-router-dom";
import { Truck, ArrowLeft } from "lucide-react";
import { Button } from "@shared/ui/button";
import { legalCopy } from "./legalCopy";

type LegalSection = {
  heading: string;
  body: string;
};

type LegalDocumentPageProps = {
  title: string;
  description: string;
  sections: readonly LegalSection[];
};

/**
 * Shell tipográfico para documentos legales públicos (términos / privacidad).
 */
export function LegalDocumentPage({
  title,
  description,
  sections,
}: LegalDocumentPageProps) {
  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/welcome" className="flex items-center gap-2">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Truck className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-bold">{legalCopy.brand}</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/welcome">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {legalCopy.backHome}
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
        <p className="text-muted-foreground text-xs">
          Actualizado: {legalCopy.updatedAt}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-3 text-base">{description}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="text-muted-foreground mt-12 border-t pt-6 text-xs">
          Contacto:{" "}
          <a
            href={`mailto:${legalCopy.contact}`}
            className="text-primary hover:underline"
          >
            {legalCopy.contact}
          </a>
        </p>
      </main>
    </div>
  );
}
