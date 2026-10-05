import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Ticket } from "lucide-react";
import { useDebounce } from "@shared/hooks";
import { ListPageShell } from "@shared/ui/page-shells";
import { useHelpArticles, useOpenTicketCount } from "../../application";
import { trackHelpSearchPerformed } from "../../application/trackHelpEvent";
import type { HelpArticle } from "../../domain";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import { ArticleSearch } from "../components/ArticleSearch";

const copy = helpCenterCopy.index;
const groupLabels = helpCenterCopy.groups;

function groupByField(articles: HelpArticle[]): Record<string, HelpArticle[]> {
  const grouped: Record<string, HelpArticle[]> = {};
  for (const article of articles) {
    const key = article.group;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(article);
  }
  return grouped;
}

export function HelpIndexPage() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: openTicketCount = 0 } = useOpenTicketCount();

  const isSearching = debouncedSearch.length >= 2;

  useEffect(() => {
    if (!isSearching) return;
    trackHelpSearchPerformed(debouncedSearch, "index", location.pathname);
  }, [isSearching, debouncedSearch, location.pathname]);

  const filters = useMemo(
    () => (isSearching ? { q: debouncedSearch } : {}),
    [isSearching, debouncedSearch],
  );
  const { data: articles = [], isLoading } = useHelpArticles(filters);

  const grouped = useMemo(() => groupByField(articles), [articles]);
  const groupKeys = Object.keys(grouped);

  return (
    <ListPageShell<HelpArticle>
      title={copy.title}
      description={copy.description}
      isLoading={isLoading}
      items={articles}
      entityLabelPlural={copy.entityLabel}
      beforeToolbar={
        <div className="flex max-w-sm items-center gap-4">
          <ArticleSearch value={search} onChange={setSearch} />
        </div>
      }
      toolbar={{
        extraActions: (
          <Link
            to="/ayuda/tickets"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            <Ticket className="h-4 w-4" />
            {helpCenterCopy.panel.myTickets(openTicketCount)}
          </Link>
        ),
      }}
      emptyState={{
        icon: <BookOpen className="h-10 w-10" />,
        title: search ? copy.searchNoResults : copy.emptyTitle,
        description: search ? undefined : copy.emptyDescription,
      }}
      renderTable={() => (
        <div className="space-y-8">
          {groupKeys.map((group) => (
            <section key={group}>
              <h2 className="mb-3 text-lg font-semibold">
                {groupLabels[group] ?? group}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[group].map((article) => (
                  <Link
                    key={article.id}
                    to={`/ayuda/${article.id}`}
                    className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <p className="text-sm font-medium group-hover:text-primary">
                      {article.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {article.phrase}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    />
  );
}

export default HelpIndexPage;
