/**
 * Shell visual del embudo auth: panel de marca (izq.) + área de formulario.
 * Modos D1–D4: login | forgot | register (stepper vía brandSlot).
 */

import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { ThemeToggle } from "@shared/ui/theme";
import { TlamaMark, Wordmark } from "@shared/ui/brand";
import { cn } from "@shared/lib/utils/cn";
import {
  authFunnelCopy as copy,
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

function BrandLockupBlock({ onBrand = false }: { onBrand?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <TlamaMark
        variant={onBrand ? "onBrand" : "brand"}
        size={onBrand ? 28 : 36}
        decorative
      />
      <div className="min-w-0">
        <Wordmark
          variant={onBrand ? "onBrand" : "brand"}
          className={onBrand ? "text-xl" : "text-2xl"}
        />
        <p
          className={cn(
            "mt-1 text-xs leading-snug",
            onBrand
              ? "text-primary-foreground/75"
              : "text-muted-foreground",
          )}
        >
          {copy.brandTagline}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[11px]",
            onBrand
              ? "text-primary-foreground/60"
              : "text-muted-foreground/80",
          )}
        >
          {copy.brandByline}
        </p>
      </div>
    </div>
  );
}

function LoginBrandPanel() {
  return (
    <>
      <div className="space-y-3 pt-1">
        <p className="text-foreground text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem] sm:leading-tight">
          {copy.claimTitle}
        </p>
        <p className="text-muted-foreground text-base leading-relaxed">
          {copy.claimBody}
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        aria-label={copy.trust.ariaLabel}
      >
        {copy.trust.items.map((item) => (
          <div
            key={item.label}
            className="bg-background/70 border-border/70 flex min-w-[108px] flex-col items-center rounded-full border px-3 py-2 text-center"
          >
            <span className="text-foreground text-sm font-semibold">
              {item.label}
            </span>
            <span className="text-muted-foreground text-xs">
              {item.hint}
            </span>
          </div>
        ))}
      </div>

      <AuthFunnelProductPreview density="compact" />
    </>
  );
}

function ForgotBrandPanel() {
  return (
    <p className="text-muted-foreground pt-2 text-base leading-relaxed">
      {copy.forgot.line}
    </p>
  );
}

function AuthFunnelShellInner({ children }: AuthFunnelShellProps) {
  const location = useLocation();
  const { brandSlot } = useAuthFunnelShell();
  const hasCustomBrand = Boolean(brandSlot);
  const isRegister = location.pathname.startsWith("/register");
  const brandMode = resolveAuthFunnelBrandMode(location.pathname);

  return (
    <div className="bg-background flex min-h-screen flex-col lg:flex-row">
      <aside
        className={cn(
          "relative hidden w-full flex-col overflow-hidden lg:flex",
          "lg:w-[min(460px,42vw)] lg:min-h-screen",
          "bg-muted text-foreground border-border border-r",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
          style={{
            backgroundImage: `
              radial-gradient(ellipse 90% 55% at 0% 0%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 55%),
              radial-gradient(ellipse 70% 45% at 100% 100%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 50%)
            `,
          }}
        />

        <div className="auth-funnel-brand-enter relative z-10 flex flex-1 flex-col gap-6 p-8 lg:p-10">
          <BrandLockupBlock />

          {brandMode === "register" && hasCustomBrand ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="min-h-0 flex-1 overflow-y-auto">{brandSlot}</div>
              <AuthFunnelProductPreview density="compact" />
            </div>
          ) : brandMode === "forgot" ? (
            <ForgotBrandPanel />
          ) : brandMode === "register" && !hasCustomBrand ? (
            /* register-closed: sin stepper ni trial */
            <LoginBrandPanel />
          ) : (
            <LoginBrandPanel />
          )}
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-1 flex-col">
        <div className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3 lg:hidden">
          <BrandLockupBlock onBrand />
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
            key={location.pathname}
            className={cn(
              "auth-funnel-panel-enter w-full",
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
