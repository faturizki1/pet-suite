import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-slate-200", className)}>
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 text-left font-medium text-slate-600", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-slate-400"
              >
                Tidak ada data
              </td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr
                key={(item as Record<string, unknown>).id as string || i}
                className={cn(
                  "border-b border-slate-100 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-slate-50"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-slate-700", col.className)}>
                    {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode || "-"}
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