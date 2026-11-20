import { AlertTriangle } from "lucide-react";
import { Card } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { parseHelpProblemItems } from "../utils/parseHelpProblemItems";
import { HelpInlineMarkdown } from "./HelpInlineMarkdown";
import { HelpRichText } from "./HelpRichText";

const copy = helpCenterCopy.detail;

interface HelpProblemListProps {
  problem: string;
  /** `tight` = densidad del panel `?` (sin Card). */
  variant?: "default" | "tight";
  className?: string;
}

/**
 * D3 — «Si falla» siempre visible (síntoma + salida + ícono warning).
 */
export function HelpProblemList({
  problem,
  variant = "default",
  className,
}: HelpProblemListProps) {
  const items = parseHelpProblemItems(problem);
  const tight = variant === "tight";

  const body =
    items.length === 0 ? (
      <HelpRichText
        markdown={problem}
        className={tight ? "text-sm" : undefined}
      />
    ) : (
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((item, index) => (
          <li
            key={index}
            className={cn(
              "grid grid-cols-[16px_minmax(0,1fr)] gap-2.5",
              tight ? "py-2" : "py-2.5",
              index < items.length - 1 && "border-b border-border",
            )}
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground"
              aria-hidden
            />
            <div className="min-w-0 text-sm leading-5">
              <span className="block font-semibold text-foreground">
                <HelpInlineMarkdown markdown={item.symptom} />
              </span>
              {item.fix ? (
                <span className="mt-0.5 block text-muted-foreground">
                  <HelpInlineMarkdown markdown={item.fix} />
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <section
      className={cn("flex flex-col gap-2", className)}
      data-help-problem=""
      data-help-problem-variant={variant}
    >
      <h2
        className={cn(
          "font-semibold",
          tight ? "text-xs leading-4" : "text-base leading-6",
        )}
      >
        {copy.problemSection}
      </h2>
      {tight ? body : <Card className="px-5 py-2">{body}</Card>}
    </section>
  );
}
