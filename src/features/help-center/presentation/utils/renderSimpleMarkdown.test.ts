import { describe, expect, it } from "vitest";
import { renderSimpleMarkdown } from "./renderSimpleMarkdown";

describe("renderSimpleMarkdown", () => {
  it("renders bold and paragraphs", () => {
    expect(renderSimpleMarkdown("Abre **Facturación**.")).toBe(
      "<p>Abre <strong>Facturación</strong>.</p>",
    );
  });

  it("renders headings without leaving # markers", () => {
    const html = renderSimpleMarkdown("### Una factura\n\nTexto");
    expect(html).toContain("<h4>Una factura</h4>");
    expect(html).not.toContain("###");
    expect(html).toContain("<p>Texto</p>");
  });

  it("renders numbered and bullet lists", () => {
    const html = renderSimpleMarkdown("1. Primero\n2. Segundo\n- Nota");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>Primero</li>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>Nota</li>");
  });

  it("strips markdown table rows", () => {
    const html = renderSimpleMarkdown(
      "| Campo | Valor |\n|-------|-------|\n| Pedido | x |\n\nReal phrase.",
    );
    expect(html).not.toContain("Campo");
    expect(html).not.toContain("|");
    expect(html).toContain("<p>Real phrase.</p>");
  });

  it("escapes raw HTML in content", () => {
    expect(renderSimpleMarkdown("<script>x</script>")).toBe(
      "<p>&lt;script&gt;x&lt;/script&gt;</p>",
    );
  });
});
