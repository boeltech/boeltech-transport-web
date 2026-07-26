/**
 * Reveal al entrar en viewport (IntersectionObserver, once).
 */
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@shared/lib/utils/cn";

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  /** Retraso en ms aplicado cuando la animación corre */
  delayMs?: number;
  style?: CSSProperties;
};

export function LandingReveal({
  children,
  className,
  delayMs = 0,
  style,
}: LandingRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add("is-visible");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("landing-reveal", className)}
      style={{
        ...style,
        ...(delayMs > 0
          ? ({ ["--landing-delay" as string]: `${delayMs}ms` } as CSSProperties)
          : undefined),
      }}
    >
      {children}
    </div>
  );
}
