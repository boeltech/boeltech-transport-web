import { useEffect, useState } from "react";
import { formatRelativeTime } from "../utils/formatRelativeTime";

const TICK_MS = 30_000;

export interface RelativeTimeProps {
  readonly iso: string | null | undefined;
  readonly className?: string;
}

/**
 * "Hace X min" con tick local ~30 s (sin llamada API).
 */
export function RelativeTime({ iso, className }: RelativeTimeProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time
      className={className}
      dateTime={iso ?? undefined}
      title={iso ?? undefined}
    >
      {formatRelativeTime(iso, nowMs)}
    </time>
  );
}
