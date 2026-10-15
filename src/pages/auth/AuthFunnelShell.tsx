/**
 * Shell visual del embudo auth: panel de marca (izq.) + área de formulario.
 * Modos D1–D4: login | forgot | reset | verify | invite | activate | register (stepper vía brandSlot).
 * Puente Patio: degradado teal↔ink; ámbar (--sidebar-primary) = señal (tip, riel);
 * CTA form = Button primary teal. Claim Inter display-ish (F1; Schibsted = F2).
 * MFA a11y; mobile header oculto en lg+ (CSS). BrandLockup en aside + mobile.
 */

import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { ThemeToggle } from "@shared/ui/theme";
import { BrandLockup } from "@shared/ui/brand";
import { cn } from "@shared/lib/utils/cn";
import {
  AUTH_FUNNEL_MINIMAL_BRAND_MODES,
  authFunnelCopy as copy,
  minimalBrandLine,
  resolveAuthFunnelBrandMode,
} from "./authFunnelCopy";
import { AuthFunnelProductPreview } from "./AuthFunnelProductPreview";
import {
  AuthFunnelShellProvider,
  useAuthFunnelShell,
} from "./AuthFunnelShellContext";
import "./authFunnel.css";

type AuthFunnelShellProps = {
  children?: ReactNode;
};

/**
 * Lockup sobre superficie ink (aside + mobile header).
 * Isotipo teal (`markVariant="brand"`) + wordmark on-ink (`onInk` →
 * `text-palette-brand-on-ink`). No usar `onBrand` aquí: es solo para `bg-primary`.
 */
function BrandLockupBlock({ markSize = 36 }: { markSize?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <BrandLockup
        variant="onInk"
        markVariant="brand"
        markSize={markSize}
        decorative
      />
      <div className="min-w-0">
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          {copy.brandTagline}
        </p>
        <p className="text-muted-foreground/80 mt-0.5 text-[11px]">
          {copy.brandByline}
        </p>
      </div>
    </div>
  );
}

function LoginBrandPanel() {
  return (
    <>
      <div className="space-y-3">
        <p className="auth-funnel-claim text-foreground text-2xl sm:text-[1.75rem]">
          {copy.claimTitle}
        </p>
        <p className="text-muted-foreground text-base leading-relaxed">
          {copy.claimBody}
        </p>
      </div>

      {/* Trust compacto; tip = ámbar señal (--sidebar-primary), no CTA teal */}
      <ul
        className="text-muted-foreground flex list-none flex-wrap items-baseline gap-x-2 gap-y-1 p-0 text-sm leading-snug"
        aria-label={copy.trust.ariaLabel}
      >
        {copy.trust.items.map((item, index) => (
          <li key={item.label} className="inline-flex items-baseline gap-1.5">
            {index === 0 ? (
              <span className="auth-funnel-trust-tip" aria-hidden />
            ) : (
              <span className="text-border" aria-hidden>
                ·
              </span>
            )}
            <span className="text-foreground font-medium">{item.label}</span>
            <span className="text-muted-foreground/90 text-xs">{item.hint}</span>
          </li>
        ))}
      </ul>

      <AuthFunnelProductPreview density="compact" />
    </>
  );
}

function MinimalBrandPanel({ line }: { line: string }) {
  return (
    <p className="text-muted-foreground text-base leading-relaxed">{line}</p>
  );
}

function AuthFunnelShellInner({ children }: AuthFunnelShellProps) {
  const location = useLocation();
  const { brandSlot } = useAuthFunnelShell();
  const hasCustomBrand = Boolean(brandSlot);
  const isRegister = location.pathname.startsWith("/register");
  const brandMode = resolveAuthFunnelBrandMode(location.pathname);
  const isMinimalBrand = AUTH_FUNNEL_MINIMAL_BRAND_MODES.has(brandMode);
  const minimalLine = minimalBrandLine(brandMode);

  return (
    <div className="auth-funnel-root bg-background flex min-h-screen flex-col lg:flex-row">
      <a
        href="#auth-form"
        className={cn(
          "auth-funnel-skip sr-only focus:not-sr-only",
          "focus:absolute focus:left-4 focus:top-4 focus:z-50",
          "focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium",
          "focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
        )}
      >
        {copy.skipLink}
      </a>

      <aside
        className={cn(
          "auth-funnel-brand relative hidden w-full flex-col overflow-hidden lg:flex",
          "lg:w-[min(460px,42vw)] lg:min-h-screen",
          "border-r",
        )}
      >
        <div className="auth-funnel-brand-atmosphere" aria-hidden />

        <div className="auth-funnel-brand-enter auth-funnel-brand-stagger relative z-10 flex flex-1 flex-col gap-6 p-8 lg:p-10">
          <BrandLockupBlock />

          {brandMode === "register" && hasCustomBrand ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="min-h-0 flex-1 overflow-y-auto">{brandSlot}</div>
              <AuthFunnelProductPreview density="compact" />
            </div>
          ) : isMinimalBrand && minimalLine ? (
            <MinimalBrandPanel line={minimalLine} />
          ) : brandMode === "register" && !hasCustomBrand ? (
            /* register-closed: sin stepper ni trial */
            <LoginBrandPanel />
          ) : (
            <LoginBrandPanel />
          )}
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-1 flex-col">
        {/* Visibilidad lg en authFunnel.css — no confiar solo en lg:hidden */}
        <div className="auth-funnel-mobile-header">
          <BrandLockupBlock markSize={28} />
        </div>

        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-10 sm:pt-8">
          <p className="text-muted-foreground text-sm">
            {copy.helpPrefix}{" "}
            <a
              href={copy.helpHref}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {copy.helpLink}
            </a>
          </p>
          <ThemeToggle variant="ghost" size="icon" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-10 sm:py-14">
          <div
            id="auth-form"
            key={location.pathname}
            tabIndex={-1}
            className={cn(
              "auth-funnel-panel-enter w-full scroll-mt-6 outline-none",
              isRegister ? "max-w-lg" : "max-w-md",
            )}
          >
            {children ?? <Outlet />}
          </div>
        </div>

        <footer className="text-muted-foreground flex flex-col items-center gap-2 px-4 pb-6 text-center text-xs sm:px-10">
          <Link
            to={copy.backHomeHref}
            className="hover:text-foreground transition-colors"
          >
            {copy.backHome}
          </Link>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>{copy.legal.copyright}</span>
            <span aria-hidden>{copy.legal.separator}</span>
            <Link
              to={copy.legal.termsHref}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {copy.legal.terms}
            </Link>
            <span aria-hidden>{copy.legal.separator}</span>
            <Link
              to={copy.legal.privacyHref}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {copy.legal.privacy}
            </Link>
          </p>
        </footer>
      </section>
    </div>
  );
}

export function AuthFunnelShell({ children }: AuthFunnelShellProps) {
  return (
    <AuthFunnelShellProvider>
      <AuthFunnelShellInner>{children}</AuthFunnelShellInner>
    </AuthFunnelShellProvider>
  );
}

export default AuthFunnelShell;
