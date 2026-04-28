import { Input } from "@shared/ui/input";
import { Search } from "lucide-react";

interface ListingSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function ListingSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: ListingSearchInputProps) {
  return (
    <div className={`relative w-full sm:w-64 ${className ?? ""}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}
