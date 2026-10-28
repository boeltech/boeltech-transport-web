import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../../ui/OpsPanel";
import { OpsBadge } from "../../ui/OpsBadge";
import {
  OPS_CONTRAST_PAIRS,
  OPS_THEME_TOKENS,
  auditOpsSoftBadges,
  auditOpsTheme,
  formatContrastRatio,
  type OpsThemeId,
} from "../opsContrastAudit";

const THEME_LABEL: Record<OpsThemeId, string> = {
  light: "Claro",
  dark: "Oscuro",
};

const OPS_AUDIT: Record<OpsThemeId, ReturnType<typeof auditOpsTheme>> = {
  light: auditOpsTheme(OPS_THEME_TOKENS.light, OPS_CONTRAST_PAIRS),
  dark: auditOpsTheme(OPS_THEME_TOKENS.dark, OPS_CONTRAST_PAIRS),
};

const SOFT_ON_SURFACE: Record<OpsThemeId, ReturnType<typeof auditOpsSoftBadges>> =
  {
    light: auditOpsSoftBadges(OPS_THEME_TOKENS.light, ["ops-surface"]),
    dark: auditOpsSoftBadges(OPS_THEME_TOKENS.dark, ["ops-surface"]),
  };

const SOFT_BADGE_CLASS: Record<string, string> = {
  "ops-ok": "ops-badge ops-badge-ok",
  "ops-warn": "ops-badge ops-badge-warn",
  "ops-danger": "ops-badge ops-badge-danger",
  "ops-lime": "ops-type-caption ops-text-lime",
};

function ContrastThemeBlock({ theme }: { theme: OpsThemeId }) {
  const results = OPS_AUDIT[theme];

  return (
    <div
      className="platform-ops ops-rounded ops-hairline space-y-2 p-3"
      data-ops-theme={theme}
      data-testid={`ops-ds-contrast-${theme}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="ops-type-caption ops-text m-0">
          {THEME_LABEL[theme]}
        </p>
        <span className="ops-font-mono ops-type-caption ops-text-muted">
          data-ops-theme=&quot;{theme}&quot;
        </span>
      </div>
      {results.map((result) => {
        const label = result.pair.label ?? `${result.pair.fg}/${result.pair.bg}`;
        const ratioText = formatContrastRatio(result.ratio);
        return (
          <div
            key={`${theme}-${result.pair.fg}-${result.pair.bg}`}
            className="ops-rounded ops-hairline flex flex-wrap items-center gap-3 p-3"
            data-testid={`ops-ds-contrast-pair-${theme}-${result.pair.fg}-${result.pair.bg}`}
            data-ops-contrast-pass={result.pass ? "true" : "false"}
            data-ops-contrast-ratio={result.ratio.toFixed(2)}
          >
            <div
              className="ops-rounded flex h-10 min-w-[8rem] flex-1 items-center justify-center px-3 ops-type-caption"
              style={{
                background: `var(--${result.pair.bg})`,
                color: `var(--${result.pair.fg})`,
              }}
            >
              Aa · {label}
            </div>
            <div className="min-w-[9rem] space-y-0.5">
              <p className="ops-type-caption ops-text m-0">
                --{result.pair.fg} / --{result.pair.bg}
              </p>
              <p className="ops-font-mono ops-type-caption ops-text-muted m-0">
                {ratioText} · min {result.pair.min}:1
              </p>
            </div>
            <OpsBadge tone={result.pass ? "ok" : "danger"}>
              {result.pass ? `AA ${ratioText}` : `Fail ${ratioText}`}
            </OpsBadge>
          </div>
        );
      })}
      {SOFT_ON_SURFACE[theme]
        .filter((result) => result.pair.fg !== "ops-lime")
        .map((result) => {
          const ratioText = formatContrastRatio(result.ratio);
          return (
            <div
              key={`${theme}-soft-${result.pair.fg}`}
              className="ops-rounded ops-hairline flex flex-wrap items-center gap-3 p-3"
              data-testid={`ops-ds-contrast-soft-${theme}-${result.pair.fg}`}
              data-ops-contrast-pass={result.pass ? "true" : "false"}
              data-ops-contrast-ratio={result.ratio.toFixed(2)}
            >
              <div className="ops-bg-surface ops-rounded flex h-10 min-w-[8rem] flex-1 items-center justify-center px-3">
                <span className={SOFT_BADGE_CLASS[result.pair.fg]}>
                  Aa · {result.pair.label}
                </span>
              </div>
              <div className="min-w-[9rem] space-y-0.5">
                <p className="ops-type-caption ops-text m-0">
                  badge {result.pair.fg.replace("ops-", "")} suave
                </p>
                <p className="ops-font-mono ops-type-caption ops-text-muted m-0">
                  {ratioText} · min {result.pair.min}:1
                </p>
              </div>
              <OpsBadge tone={result.pass ? "ok" : "danger"}>
                {result.pass ? `AA ${ratioText}` : `Fail ${ratioText}`}
              </OpsBadge>
            </div>
          );
        })}
    </div>
  );
}

/**
 * Contraste AA medido (AUDIT-D10) — ratios vía `contrast*` shared; ambos temas.
 */
export function OpsContrastSection() {
  return (
    <div className="space-y-4" data-testid="ops-ds-contrast">
      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Contraste AA (light + dark)</OpsPanelTitle>
          <OpsPanelDescription>
            Ratios calculados con helpers shared (`computeContrastRatio` /
            `auditContrastPairs`) sobre tokens Ops. Sin Pass hardcoded. Texto
            ≥4.5:1. Focus: ring accent 2px + offset 2px.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ContrastThemeBlock theme="light" />
            <ContrastThemeBlock theme="dark" />
          </div>
          <p className="ops-type-caption ops-text-muted m-0">
            Focus ring demo:{" "}
            <button type="button" className="ops-chip ops-ring-accent">
              Tab aquí
            </button>
          </p>
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
