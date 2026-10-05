import { memo } from "react";
import { Input } from "@shared/ui/input";
import { Search } from "lucide-react";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.panel;

interface ArticleSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ArticleSearch = memo(function ArticleSearch({
  value,
  onChange,
  placeholder = copy.searchPlaceholder,
}: ArticleSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );
});
