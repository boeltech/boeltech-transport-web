/**
 * Smoke dark — catálogo: badges y stats de importación con tokens DS.
 */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import {
  expectNoRawTailwindColors,
  renderWithTheme,
} from "@/test/renderWithTheme";

function CatalogImportResultMock() {
  return (
    <div className="space-y-4">
      <Alert variant="success">
        <AlertTitle>Importación completada</AlertTitle>
        <AlertDescription>Versión 2026.1</AlertDescription>
      </Alert>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-success-soft p-4 text-center">
          <p className="text-2xl font-bold text-success-soft-foreground">12</p>
          <p className="text-sm text-muted-foreground">Insertados</p>
        </div>
        <div className="rounded-lg bg-info-soft p-4 text-center">
          <p className="text-2xl font-bold text-info-soft-foreground">3</p>
          <p className="text-sm text-muted-foreground">Actualizados</p>
        </div>
        <div className="rounded-lg bg-destructive-soft p-4 text-center">
          <p className="text-2xl font-bold text-destructive-soft-foreground">
            0
          </p>
          <p className="text-sm text-muted-foreground">Errores</p>
        </div>
      </div>
      <Badge variant="warning" tone="soft">
        Catálogo grande
      </Badge>
    </div>
  );
}

describe("catalog dark smoke", () => {
  it("renders import result pattern in dark without raw palette classes", () => {
    const { container } = renderWithTheme(<CatalogImportResultMock />, {
      resolvedTheme: "dark",
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByText("Importación completada")).toBeInTheDocument();
    expect(screen.getByText("Insertados")).toBeInTheDocument();
    expectNoRawTailwindColors(container);
  });
});
