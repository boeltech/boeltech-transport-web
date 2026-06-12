import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import type { ResolvedTheme, ThemeMode } from "@/shared/ui/theme/types";
import { applyResolvedThemeToDocument } from "@/shared/ui/theme/themeRuntime";

export const RAW_COLOR_PATTERN =
  /\b(bg|text|border)-(red|blue|green|yellow|amber|emerald|gray|slate|white)-\d/;

export function collectClassNames(element: HTMLElement): string {
  const classes = [element.className];
  element.querySelectorAll("[class]").forEach((node) => {
    classes.push((node as HTMLElement).className);
  });
  return classes.join(" ");
}

export function expectNoRawTailwindColors(container: HTMLElement): void {
  const classes = collectClassNames(container);
  expect(classes).not.toMatch(RAW_COLOR_PATTERN);
}

export interface RenderWithThemeOptions extends Omit<RenderOptions, "wrapper"> {
  resolvedTheme?: ResolvedTheme;
  themeMode?: ThemeMode;
  route?: MemoryRouterProps["initialEntries"];
  withQueryClient?: boolean;
}

function ThemeTestWrapper({
  children,
  resolvedTheme = "dark",
  themeMode,
  route = ["/"],
  withQueryClient = true,
}: {
  children: ReactNode;
  resolvedTheme?: ResolvedTheme;
  themeMode?: ThemeMode;
  route?: MemoryRouterProps["initialEntries"];
  withQueryClient?: boolean;
}) {
  const defaultMode: ThemeMode =
    themeMode ?? (resolvedTheme === "dark" ? "dark" : "light");

  applyResolvedThemeToDocument(resolvedTheme);

  const content = (
    <ThemeProvider defaultMode={defaultMode}>
      <MemoryRouter initialEntries={route}>{children}</MemoryRouter>
    </ThemeProvider>
  );

  if (!withQueryClient) {
    return content;
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
  );
}

export function renderWithTheme(
  ui: ReactElement,
  {
    resolvedTheme = "dark",
    themeMode,
    route = ["/"],
    withQueryClient = true,
    ...options
  }: RenderWithThemeOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeTestWrapper
        resolvedTheme={resolvedTheme}
        themeMode={themeMode}
        route={route}
        withQueryClient={withQueryClient}
      >
        {children}
      </ThemeTestWrapper>
    ),
    ...options,
  });
}
