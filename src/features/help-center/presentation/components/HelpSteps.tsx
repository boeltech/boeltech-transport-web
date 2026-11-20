import { Card } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { parseHelpGuideSteps } from "../utils/parseHelpGuideSteps";
import { HelpInlineMarkdown } from "./HelpInlineMarkdown";
import { HelpRichText } from "./HelpRichText";

const copy = helpCenterCopy.detail;

interface HelpStepsProps {
  guide: string;
  /** `tight` = densidad del panel `?` (sin Card, tipografía más compacta). */
  variant?: "default" | "tight";
  className?: string;
}

/**
 * D1 — pasos numerados (círculo + riel) para la página de artículo.
 * Si el guide no trae líneas `1.`… cae a HelpRichText.
 */
export function HelpSteps({
  guide,
  variant = "default",
  className,
}: HelpStepsProps) {
  const steps = parseHelpGuideSteps(guide);
  const tight = variant === "tight";

  const heading = (
    <h2
      className={cn(
        "font-semibold",
        tight
          ? "flex items-center gap-2 text-xs leading-4"
          : "flex items-center gap-2 text-base leading-6",
      )}
    >
      {copy.stepsSection}
      {steps.length > 0 ? (
        <span className="font-mono text-[11px] font-medium text-muted-foreground">
          {steps.length}
        </span>
      ) : null}
    </h2>
  );

  const body =
    steps.length === 0 ? (
      <HelpRichText markdown={guide} className={tight ? "text-sm" : undefined} />
    ) : (
      <ol className="m-0 flex list-none flex-col p-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li
              key={index}
              className={cn(
                "relative grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3",
                tight ? "py-1.5" : "py-2",
              )}
            >
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-full border border-primary-200 bg-primary-50 font-mono text-xs font-bold tabular-nums text-primary-700",
                  tight ? "mt-0 size-5 text-[10px]" : "mt-[-2px] size-6",
                )}
                aria-hidden
              >
                {index + 1}
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    "absolute w-px bg-border",
                    tight
                      ? "bottom-[-4px] left-2.5 top-[26px]"
                      : "bottom-[-6px] left-3 top-[30px]",
                  )}
                  aria-hidden
                />
              ) : null}
              <span className="min-w-0 text-sm leading-5 text-foreground">
                <HelpInlineMarkdown markdown={step} />
              </span>
            </li>
          );
        })}
      </ol>
    );

  return (
    <section
      className={cn("flex flex-col gap-2", className)}
      data-help-steps=""
      data-help-steps-variant={variant}
    >
      {heading}
      {tight ? (
        body
      ) : (
        <Card className="px-5 py-2">{body}</Card>
      )}
    </section>
  );
}
