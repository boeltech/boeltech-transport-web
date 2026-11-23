import { useMemo } from "react";
import { selectPrimaryHelpArticle } from "./selectPrimaryHelpArticle";
import { useFusedHelpScreen } from "./useMergedHelpScreen";
import { useHelpArticles } from "./useHelpArticles";

export type HelpPhraseForScreen = {
  articleId: string;
  phrase: string;
  title: string;
};

/**
 * Phrase del artículo primario para la pantalla actual (TEC Ola A §4.2).
 * Fuente: `GET /help/articles?screen=` — no hardcodear phrase en features dueñas.
 * `screen` se fusiona con extras opacos (corte B `status=`) antes del GET.
 */
export function useHelpPhraseForScreen(
  screen: string,
  options?: { enabled?: boolean },
): HelpPhraseForScreen | null {
  const fusedScreen = useFusedHelpScreen(screen);
  const enabled = options?.enabled ?? Boolean(fusedScreen);
  const { data: articles } = useHelpArticles(
    { screen: fusedScreen },
    { enabled },
  );

  return useMemo(() => {
    if (!enabled) return null;
    const primary = selectPrimaryHelpArticle(articles);
    if (!primary) return null;
    return {
      articleId: primary.id,
      phrase: primary.phrase,
      title: primary.title,
    };
  }, [articles, enabled]);
}
