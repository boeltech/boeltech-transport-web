import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { HelpPanel } from "./HelpPanel";

export type OpenHelpPanelOptions = {
  articleId?: string;
  expand?: boolean;
};

type HelpPanelContextValue = {
  openHelpPanel: (options?: OpenHelpPanelOptions) => void;
};

const HelpPanelContext = createContext<HelpPanelContextValue | null>(null);

export function useHelpPanel(): HelpPanelContextValue {
  const ctx = useContext(HelpPanelContext);
  if (!ctx) {
    throw new Error(
      "useHelpPanel must be used within HelpPanelProvider (authenticated shell)",
    );
  }
  return ctx;
}

/** Safe variant for optional surfaces; returns no-op outside provider. */
export function useHelpPanelOptional(): HelpPanelContextValue {
  const ctx = useContext(HelpPanelContext);
  return (
    ctx ?? {
      openHelpPanel: () => {
        /* no provider — e.g. tests without shell */
      },
    }
  );
}

interface HelpPanelProviderProps {
  children: ReactNode;
}

/**
 * Monta el Sheet de ayuda una sola vez y expone `openHelpPanel` a empties / ⌘K.
 */
export const HelpPanelProvider = memo(function HelpPanelProvider({
  children,
}: HelpPanelProviderProps) {
  const [open, setOpen] = useState(false);
  const [expandArticleId, setExpandArticleId] = useState<string | null>(null);

  const openHelpPanel = useCallback((options?: OpenHelpPanelOptions) => {
    const articleId = options?.articleId?.trim() || null;
    if (articleId && options?.expand) {
      setExpandArticleId(articleId);
    } else {
      setExpandArticleId(null);
    }
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setExpandArticleId(null);
  }, []);

  const value = useMemo(() => ({ openHelpPanel }), [openHelpPanel]);

  return (
    <HelpPanelContext.Provider value={value}>
      {children}
      <HelpPanel
        open={open}
        onOpenChange={handleOpenChange}
        expandArticleId={expandArticleId}
      />
    </HelpPanelContext.Provider>
  );
});
