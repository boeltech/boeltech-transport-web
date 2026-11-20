import { memo, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, ChevronRight, Ticket } from "lucide-react";
import config from "@shared/config/env";
import { useDebounce } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { ListPageShell } from "@shared/ui/page-shells";
import { useHelpArticles, useOpenTicketCount } from "../../application";
import { trackHelpSearchPerformed } from "../../application/trackHelpEvent";
import type { HelpArticle } from "../../domain";
import { helpCenterCopy } from "../copy/helpCenterCopy";
import {
  resolveHelpDisplayGroup,
  sortHelpGroupKeys,
} from "../utils/helpDisplayGroup";

const copy = helpCenterCopy.index;
const groupLabels = helpCenterCopy.groups;

function groupByDisplay(articles: HelpArticle[]): Record<string, HelpArticle[]> {
  const grouped: Record<string, HelpArticle[]> = {};
  for (const article of articles) {
    const key = resolveHelpDisplayGroup(article.id, article.group);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(article);
  }
  return grouped;
}

export function HelpIndexPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const ticketsEnabled = config.help.ticketsEnabled;
  const { data: openTicketCount = 0 } = useOpenTicketCount({
    enabled: ticketsEnabled,
  });

  const isSearching = debouncedSearch.length >= 2;

  useEffect(() => {
    if (!isSearching) return;
    trackHelpSearchPerformed(debouncedSearch, "index", location.pathname);
  }, [isSearching, debouncedSearch, location.pathname]);

  const filters = useMemo(
    () => (isSearching ? { q: debouncedSearch } : {}),
    [isSearching, debouncedSearch],
  );
  const {
    data: articles = [],
    isLoading,
    isError,
    refetch,
  } = useHelpArticles(filters);

  const showLoadError = isError && !isLoading;
  const hasSearch = search.trim().length > 0;
  const grouped = useMemo(() => groupByDisplay(articles), [articles]);
  const groupKeys = useMemo(
    () => sortHelpGroupKeys(Object.keys(grouped)),
    [grouped],
  );

  const clearSearch = () => setSearch("");

  return (
    <ListPageShell<HelpArticle>
      title={copy.title}
      description={copy.description}
      isLoading={isLoading || showLoadError}
      items={articles}
      entityLabelPlural={copy.entityLabel}
      beforeToolbar={
        showLoadError ? (
          <DetailAlertCard
            severity="critical"
            icon={<AlertCircle className="h-5 w-5" aria-hidden />}
            title={copy.loadErrorTitle}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetch();
                }}
              >
                {copy.loadErrorRetry}
              </Button>
            }
          >
            <p>{copy.loadErrorDescription}</p>
          </DetailAlertCard>
        ) : null
      }
      toolbar={{
        search: {
          value: search,
          onChange: setSearch,
          placeholder: copy.searchPlaceholder,
          className: "w-full sm:max-w-md",
        },
        extraActions: ticketsEnabled ? (
          <Link
            to="/ayuda/tickets"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            <Ticket className="h-4 w-4" />
            {helpCenterCopy.panel.myTickets(openTicketCount)}
          </Link>
        ) : undefined,
      }}
      emptyState={{
        icon: <BookOpen className="h-10 w-10" />,
        title: hasSearch ? copy.searchNoResults : copy.emptyTitle,
        description: hasSearch ? undefined : copy.emptyDescription,
        secondaryCta: hasSearch
          ? {
              label: copy.clearSearch,
              onClick: clearSearch,
              variant: "outline",
            }
          : undefined,
      }}
      renderTable={() =>
        showLoadError ? null : (
          <div className="space-y-8" data-help-index="">
            {groupKeys.map((group) => (
              <section key={group} data-help-group={group}>
                <h2 className="mb-3 text-lg font-semibold">
                  {groupLabels[group] ?? group}
                </h2>
                {/* AY-H7: una superficie por grupo; filas, no EntityListCard anidados */}
                <ul className="m-0 grid list-none grid-cols-1 overflow-hidden rounded-xl border bg-card p-0 shadow-sm sm:grid-cols-2">
                  {grouped[group].map((article) => (
                    <li
                      key={article.id}
                      className="border-b border-border last:border-b-0 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
                    >
                      <HelpArticleRow
                        article={article}
                        onOpen={() => navigate(`/ayuda/${article.id}`)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      }
    />
  );
}

interface HelpArticleRowProps {
  article: HelpArticle;
  onOpen: () => void;
}

const HelpArticleRow = memo(function HelpArticleRow({
  article,
  onOpen,
}: HelpArticleRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      data-help-article-row=""
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-5 text-foreground">
          {article.title}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-[18px] text-muted-foreground">
          {article.phrase}
        </span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
});

export default HelpIndexPage;
