import { useMemo } from "react";
import { selectPrimaryHelpArticle } from "./selectPrimaryHelpArticle";
import { useHelpArticles } from "./useHelpArticles";

export type HelpPhraseForScreen = {
  articleId: string;
  phrase: string;
  title: string;
};

/**
 * Phrase del artículo primario para la ruta actual (TEC Ola A §4.2).
 * Fuente: `GET /help/articles?screen=` — no hardcodear phrase en features dueñas.
 */
export function useHelpPhraseForScreen(
  pathname: string,
  options?: { enabled?: boolean },
): HelpPhraseForScreen | null {
  const enabled = options?.enabled ?? Boolean(pathname);
  const { data: articles } = useHelpArticles(
    { screen: pathname },
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
