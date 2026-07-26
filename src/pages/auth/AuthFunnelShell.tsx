/**
 * Shell visual del embudo auth: panel de marca (izq.) + área de formulario.
 * Branding a la izquierda (SaasAble mirror). Form cardless; preview de producto.
 */

import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { CheckCircle2, Truck } from "lucide-react";

import { ThemeToggle } from "@shared/ui/theme";
import { cn } from "@shared/lib/utils/cn";
import { authFunnelCopy as copy } from "./authFunnelCopy";
import { AuthFunnelProductPreview } from "./AuthFunnelProductPreview";
import {
  AuthFunnelShellProvider,
  useAuthFunnelShell,
} from "./AuthFunnelShellContext";
import "./authFunnel.css";

type AuthFunnelShellProps = {
  children?: ReactNode;
};

function AuthFunnelShellInner({ children }: AuthFunnelShellProps) {
  const location = useLocation();
  const { brandSlot } = useAuthFunnelShell();
  const hasCustomBrand = Boolean(brandSlot);
  const isRegister = location.pathname.startsWith("/register");

  return (
    <div className="bg-background flex min-h-screen flex-col lg:flex-row">
      {/* Panel marca — izquierda, superficie suave + preview */}
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
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl shadow-sm">
              <Truck className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none tracking-tight">
                {copy.brand}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {copy.brandTagline}
              </p>
            </div>
          </div>

          {hasCustomBrand ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="min-h-0 flex-1 overflow-y-auto">{brandSlot}</div>
              <AuthFunnelProductPreview density="compact" />
            </div>
          ) : (
            <>
              <div className="space-y-3 pt-1">
                <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-[1.9rem] sm:leading-tight">
                  {copy.claimTitle}
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {copy.claimBody}
                </p>
              </div>

              <ul className="space-y-3">
                {copy.highlights.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="bg-primary/15 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <AuthFunnelProductPreview />
            </>
          )}
        </div>
      </aside>

      {/* Panel contenido */}
      <section className="relative flex min-h-screen flex-1 flex-col">
        <div className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3 lg:hidden">
          <div className="bg-primary-foreground/15 flex h-9 w-9 items-center justify-center rounded-lg">
            <Truck className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none">{copy.brand}</p>
            <p className="text-primary-foreground/75 mt-0.5 truncate text-xs">
              {copy.brandTagline}
            </p>
          </div>
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
