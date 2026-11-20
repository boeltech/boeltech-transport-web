import { renderSimpleMarkdown } from "../utils/renderSimpleMarkdown";

/**
 * Inline markdown (negritas) sin envolver en bloque prose/listas.
 * Extrae el HTML de un párrafo o lo usa tal cual si no hay `<p>`.
 */
export function HelpInlineMarkdown({ markdown }: { markdown: string }) {
  const html = renderSimpleMarkdown(markdown.trim());
  const unwrapped = html
    .replace(/^<p>/, "")
    .replace(/<\/p>$/, "")
    .replace(/<\/?p>/g, " ");

  return (
    <span
      className="[&_strong]:font-semibold [&_strong]:text-foreground"
      dangerouslySetInnerHTML={{ __html: unwrapped }}
    />
  );
}
