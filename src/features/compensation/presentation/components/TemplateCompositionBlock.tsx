import type { LucideIcon } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { CompositionBlockStatus, TemplateCompositionBlock } from "../utils/templateCompositionTypes";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.compositionCanvas;

interface TemplateCompositionBlockProps {
  block: TemplateCompositionBlock;
  icon: LucideIcon;
  className?: string;
}

function statusBorderClass(status: CompositionBlockStatus): string {
  switch (status) {
    case "complete":
      return "border-border";
    case "warning":
      return "border-warning/40 border-dashed";
    case "empty":
    default:
      return "border-dashed border-muted-foreground/30";
  }
}

export function TemplateCompositionBlockView({
  block,
  icon: Icon,
  className,
}: TemplateCompositionBlockProps) {
  const isEmpty = block.items.length === 0;

  return (
    <section
      className={cn(
        "rounded-lg border bg-muted/20 px-3 py-2.5",
        statusBorderClass(block.status),
        className,
      )}
      aria-label={block.label}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{block.label}</span>
      </div>

      {isEmpty ? (
        <p className="mt-1.5 text-sm text-muted-foreground/80">{copy.emptyBlock}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {block.items.map((item, index) => (
            <li
              key={`${block.id}-${item.title}-${index}`}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{item.title}</p>
                {item.subtitle ? (
                  <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                ) : null}
              </div>
              {item.amount ? (
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {item.amount}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
