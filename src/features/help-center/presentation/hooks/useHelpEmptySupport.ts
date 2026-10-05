import { useMemo } from "react";
import { useHelpPhraseForScreen } from "../../application";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { useHelpPanelOptional } from "../components/HelpPanelController";

export type HelpEmptySupport = {
  phrase: string;
  viewHelpCta: {
    label: string;
    onClick: () => void;
    variant: "outline";
  };
};

/**
 * Phrase + CTA «Ver ayuda» para empty states de producto (TEC §4.2).
 * Solo habilitar en empties «sin datos» (no filtros / error).
 */
export function useHelpEmptySupport(
  pathname: string,
  enabled: boolean,
): HelpEmptySupport | null {
  const help = useHelpPhraseForScreen(pathname, { enabled });
  const { openHelpPanel } = useHelpPanelOptional();

  return useMemo(() => {
    if (!enabled || !help) return null;
    return {
      phrase: help.phrase,
      viewHelpCta: {
        label: helpCenterCopy.surfaces.viewHelp,
        onClick: () =>
          openHelpPanel({ articleId: help.articleId, expand: true }),
        variant: "outline" as const,
      },
    };
  }, [enabled, help, openHelpPanel]);
}
