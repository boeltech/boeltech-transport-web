/**
 * Renders basic markdown for help-center seed content.
 * Supports: headings (## / ###), bold, bullet/numbered lists, paragraphs.
 * Safe only for controlled content (not user-authored ticket bodies).
 */
export function renderSimpleMarkdown(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const body = inlineMarkdown(paragraph.join(" ").trim());
    if (body) html.push(`<p>${body}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType) return;
    html.push(listType === "ul" ? "</ul>" : "</ol>");
    listType = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Skip leaked markdown tables / frontmatter separators
    if (/^\|/.test(trimmed) || /^[-|:\s]+$/.test(trimmed)) {
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 4); // # → h2, ## → h3, ### → h4
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const ordered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") {
        flushList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inlineMarkdown(ordered[2])}</li>`);
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (listType !== "ul") {
        flushList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return html.join("");
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
