import { cn } from "@shared/lib/utils/cn";
import { renderSimpleMarkdown } from "../utils/renderSimpleMarkdown";

interface HelpRichTextProps {
  markdown: string;
  className?: string;
}

/**
 * Renders controlled help-article markdown with visible lists.
 * Tailwind preflight strips list styles; we restore them without @tailwindcss/typography.
 */
export function HelpRichText({ markdown, className }: HelpRichTextProps) {
  return (
    <div
      className={cn(
        "max-w-none text-foreground leading-relaxed",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1",
        "[&_li]:marker:text-muted-foreground",
        "[&_p]:mt-2 [&_p:first-child]:mt-0",
        "[&_h3]:font-semibold [&_h4]:font-semibold",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(markdown) }}
    />
  );
}
