import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
};

export function DataTable<T extends { id: string }>({
  title, rows, columns, actions, count,
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
  actions?: ReactNode;
  count?: number;
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? rows.filter((r) =>
        columns.some((c) => (c.searchValue?.(r) ?? "").toLowerCase().includes(q.toLowerCase())),
      )
    : rows;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-lg">{title}</h2>
          <span className="bg-[#A50034] text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
            {count ?? rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filtrer…"
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-[#A50034] focus:bg-white"
            />
          </div>
          {actions}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="text-left px-5 py-3 font-semibold">{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-5 py-3 align-middle">{c.render(r)}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-slate-400 py-10">
                  Aucun résultat
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "En attente": "bg-amber-100 text-amber-700",
    "En cours de livraison": "bg-blue-100 text-blue-700",
    "Livré": "bg-green-100 text-green-700",
    "standard": "bg-slate-100 text-slate-700",
    "convention": "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}
