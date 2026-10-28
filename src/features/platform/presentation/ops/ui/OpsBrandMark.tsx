import { cn } from "@shared/lib/utils/cn";
import { opsCopy } from "../opsCopy";

export type OpsBrandMarkSize = "rail" | "hero";

export interface OpsBrandMarkProps {
  /** `rail` = chrome; `hero` = login protagonista (LID-D8 / M4). */
  size?: OpsBrandMarkSize;
  /** Subtítulo de entorno junto al wordmark (rail, misma línea). */
  showEnv?: boolean;
  className?: string;
}

/**
 * Marca Ops — wordmark `boeltech/ops` + monograma `b/`.
 * El nombre accesible es el texto visible. Sin Shield ni badge «Ops».
 */
export function OpsBrandMark({
  size = "rail",
  showEnv = false,
  className,
}: OpsBrandMarkProps) {
  const isHero = size === "hero";
  const slash = opsCopy.wordmark.indexOf("/");
  const prefix =
    slash >= 0 ? opsCopy.wordmark.slice(0, slash) : opsCopy.wordmark;
  const suffix = slash >= 0 ? opsCopy.wordmark.slice(slash + 1) : "";

  return (
    <div
      className={cn(
        "ops-brand-mark",
        isHero && "ops-brand-mark-hero",
        className,
      )}
      data-testid="ops-brand-mark"
      data-ops-brand={size}
    >
      <span
        className={cn(
          "ops-bg-accent ops-rounded ops-font-mono shrink-0 font-semibold leading-none",
          isHero
            ? "flex h-14 w-14 items-center justify-center text-xl"
            : "flex h-8 w-8 items-center justify-center text-xs",
        )}
        aria-hidden="true"
      >
        {opsCopy.monogram}
      </span>
      <div className={cn("ops-brand-mark-line", isHero && "text-center")}>
        <p
          className={cn(
            "ops-brand-mark-name ops-text font-semibold tracking-tight",
            isHero ? "ops-type-display" : "ops-type-caption",
          )}
        >
          <span>{prefix}</span>
          {suffix ? (
            <>
              <span className="ops-font-mono ops-text-muted">/</span>
              <span className="ops-font-mono">{suffix}</span>
            </>
          ) : null}
        </p>
        {showEnv ? (
          <p className="ops-brand-mark-env ops-type-caption ops-text-muted">
            {opsCopy.envLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
