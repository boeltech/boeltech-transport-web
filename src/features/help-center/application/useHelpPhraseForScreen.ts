import { useMemo } from "react";
import { selectPrimaryHelpArticle } from "./selectPrimaryHelpArticle";
import { useHelpArticles } from "./useHelpArticles";

export type HelpPhraseForScreen = {
  articleId: string;
  phrase: string;
  title: string;
};

/**
 * Phrase del artículo primario para la pantalla actual (TEC Ola A §4.2).
 * Fuente: `GET /help/articles?screen=` — no hardcodear phrase en features dueñas.
 * `screen` = `pathname + search` cuando la vista depende de query (p. ej. Análisis `?view=`).
 */
export function useHelpPhraseForScreen(
  screen: string,
  options?: { enabled?: boolean },
): HelpPhraseForScreen | null {
  const enabled = options?.enabled ?? Boolean(screen);
  const { data: articles } = useHelpArticles(
    { screen },
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
