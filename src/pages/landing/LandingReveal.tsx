/**
 * Reveal al entrar en viewport (IntersectionObserver, once).
 * `eager`: above-fold — sin IO; en motion corre enter en mount; reduced-motion = visible frame 0.
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
  /**
   * Above-fold: sin IntersectionObserver.
   * Con motion: monta oculto y entra en el siguiente frame.
   * Con reduced-motion: visible de inmediato (sin opacity:0 persistente).
   */
  eager?: boolean;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LandingReveal({
  children,
  className,
  delayMs = 0,
  style,
  eager = false,
}: LandingRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (eager) {
      if (prefersReducedMotion()) {
        el.classList.add("is-visible");
        return;
      }
      const id = window.requestAnimationFrame(() => {
        el.classList.add("is-visible");
      });
      return () => window.cancelAnimationFrame(id);
    }

    if (prefersReducedMotion()) {
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
  }, [eager]);

  return (
    <div
      ref={ref}
      className={cn("landing-reveal", eager && "is-eager", className)}
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
