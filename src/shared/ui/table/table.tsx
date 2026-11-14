import * as React from "react";

import { cn } from "@shared/lib/utils/cn";

/** Operate density (T2). Omit = legacy defaults for unmigrated tables. */
export type TableDensity = "list" | "compact";

const TableDensityContext = React.createContext<TableDensity | undefined>(
  undefined,
);

function useResolvedDensity(
  densityProp?: TableDensity,
): TableDensity | undefined {
  const fromContext = React.useContext(TableDensityContext);
  return densityProp ?? fromContext;
}

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  density?: TableDensity;
};

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, density, ...props }, ref) => (
    <TableDensityContext.Provider value={density}>
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </div>
    </TableDensityContext.Provider>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  density?: TableDensity;
};

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, density: densityProp, ...props }, ref) => {
    const density = useResolvedDensity(densityProp);
    return (
      <tr
        ref={ref}
        className={cn(
          density
            ? "border-b transition-colors hover:bg-muted data-[state=selected]:bg-primary-50"
            : "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
          className,
        )}
        {...props}
      />
    );
  },
);
TableRow.displayName = "TableRow";

type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  density?: TableDensity;
};

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, density: densityProp, ...props }, ref) => {
    const density = useResolvedDensity(densityProp);
    return (
      <th
        ref={ref}
        className={cn(
          density
            ? "h-9 px-3 first:pl-4 text-left align-middle text-xs font-medium text-muted-foreground bg-muted [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
            : "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
          className,
        )}
        {...props}
      />
    );
  },
);
TableHead.displayName = "TableHead";

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  density?: TableDensity;
};

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, density: densityProp, ...props }, ref) => {
    const density = useResolvedDensity(densityProp);
    return (
      <td
        ref={ref}
        className={cn(
          density === "list"
            ? "h-11 px-3 first:pl-4 text-sm align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
            : density === "compact"
              ? "h-9 px-3 first:pl-4 text-sm align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
              : "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
          className,
        )}
        {...props}
      />
    );
  },
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
