/**
 * Cabecera editorial del form auth (sin Card).
 */
import { cn } from "@shared/lib/utils/cn";

type AuthFunnelFormHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function AuthFunnelFormHeader({
  title,
  description,
  className,
}: AuthFunnelFormHeaderProps) {
  return (
    <header className={cn("mb-8 space-y-2 text-center", className)}>
      <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="text-muted-foreground text-sm leading-relaxed text-balance">
          {description}
        </p>
      ) : null}
    </header>
  );
}
