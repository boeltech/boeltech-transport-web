import { memo, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, ChevronRight, Ticket } from "lucide-react";
import config from "@shared/config/env";
import { useDebounce } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { CardContent, CardHeader } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EntityListCard } from "@shared/ui/listing";
import { ListPageShell } from "@shared/ui/page-shells";
import { useHelpArticles, useOpenTicketCount } from "../../application";
import { trackHelpSearchPerformed } from "../../application/trackHelpEvent";
import type { HelpArticle } from "../../domain";
import { helpCenterCopy } from "../copy/helpCenterCopy";

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
  const grouped = useMemo(() => groupByField(articles), [articles]);
  const groupKeys = Object.keys(grouped);

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
          <div className="space-y-8">
            {groupKeys.map((group) => (
              <section key={group}>
                <h2 className="mb-3 text-lg font-semibold">
                  {groupLabels[group] ?? group}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[group].map((article) => (
                    <HelpArticleTile
                      key={article.id}
                      article={article}
                      onOpen={() => navigate(`/ayuda/${article.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      }
    />
  );
}

interface HelpArticleTileProps {
  article: HelpArticle;
  onOpen: () => void;
}

const HelpArticleTile = memo(function HelpArticleTile({
  article,
  onOpen,
}: HelpArticleTileProps) {
  return (
    <EntityListCard onClick={onOpen}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium">{article.title}</h3>
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {article.phrase}
        </p>
      </CardContent>
    </EntityListCard>
  );
});

export default HelpIndexPage;
