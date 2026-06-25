"use client";
import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  sortable?: boolean;
  sortValue?: (row: T) => number | string;
}

function compareVals(a: number | string, b: number | string): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  loading = false,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  let display = rows;
  if (sort) {
    const col = columns.find((c) => c.key === sort.key);
    if (col?.sortValue) {
      const sv = col.sortValue;
      display = [...rows].sort((a, b) => {
        const cmp = compareVals(sv(a), sv(b));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
  }

  function toggleSort(key: string) {
    setSort((prev) => (prev?.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted",
                  col.align === "right" ? "text-right" : "text-left",
                  col.sortable && "cursor-pointer select-none hover:text-ink",
                )}
                onClick={col.sortable ? () => toggleSort(col.key) : undefined}
              >
                {col.header}
                {sort?.key === col.key && <span className="ml-1">{sort.dir === "asc" ? "↑" : "↓"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <span className="block h-4 w-2/3 animate-pulse rounded bg-surface-subtle" />
                  </td>
                ))}
              </tr>
            ))
          ) : display.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">
                {empty ?? "No records"}
              </td>
            </tr>
          ) : (
            display.map((row) => (
              <tr
                key={getRowKey(row)}
                className={cn("border-b border-hairline last:border-0 even:bg-surface-alt", onRowClick && "cursor-pointer hover:bg-brand-wash")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-ink", col.align === "right" && "text-right")}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
