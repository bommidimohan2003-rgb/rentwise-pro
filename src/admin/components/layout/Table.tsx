import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Loader } from "./Loader";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  emptyTitle?: string;
  emptyDescription?: string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  onSort,
  sortKey,
  sortOrder,
  emptyTitle,
  emptyDescription,
}: TableProps<T>) {
  return (
    <div className="card-premium bg-card/40 border border-border/80 overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border/50">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const alignClass = {
                  left: "text-left",
                  center: "text-center",
                  right: "text-right",
                }[col.align || "left"];

                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && onSort && onSort(col.key)}
                    className={cn(
                      "px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider select-none",
                      col.sortable &&
                        "cursor-pointer hover:text-foreground hover:bg-secondary/30 transition-colors",
                      alignClass,
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        col.align === "center" && "justify-center",
                        col.align === "right" && "justify-end",
                      )}
                    >
                      {col.label}
                      {col.sortable && (
                        <span>
                          {isSorted ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-20">
                  <Loader message="Fetching records..." size="md" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-secondary/20 transition-colors group/row">
                  {columns.map((col) => {
                    const alignClass = {
                      left: "text-left",
                      center: "text-center",
                      right: "text-right",
                    }[col.align || "left"];

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-6 py-4 text-sm text-foreground/90 font-medium truncate max-w-xs",
                          alignClass,
                        )}
                      >
                        {col.render
                          ? col.render(row, rIdx)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
