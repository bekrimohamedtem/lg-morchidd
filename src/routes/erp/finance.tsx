import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useErp, fmtDA } from "@/lib/erp/store";
import { analyzeFinance } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  AreaChart, Area, CartesianGrid, Legend,
} from "recharts";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Wallet, Receipt, FileDown, Calendar } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/erp/DataTable";

export const Route = createFileRoute("/erp/finance")({ component: FinancePage });

type DailyRow = { dateKey: string; dateLabel: string; ca: number; cost: number; benef: number; count: number };

function FinancePage() {
  const { orders, employees } = useErp();
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const ca = orders.reduce((s, o) => s + o.total, 0);
  const benef = orders.reduce((s, o) => s + (o.total - o.totalInitial), 0);
  const cost = ca - benef;
  const margin = ca > 0 ? (benef / ca) * 100 : 0;

  // Daily history aggregation
  const history: DailyRow[] = useMemo(() => {
    const now = new Date();
    const map = new Map<string, DailyRow>();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      map.set(key, {
        dateKey: key,
        dateLabel: d.toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" }),
        ca: 0, cost: 0, benef: 0, count: 0,
      });
    }
    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const row = map.get(key);
      if (!row) continue;
      row.ca += o.total;
      row.cost += o.totalInitial;
      row.benef += o.total - o.totalInitial;
      row.count += 1;
    }
    return Array.from(map.values());
  }, [orders, range]);

  const rangeTotals = useMemo(() => {
    return history.reduce(
      (acc, r) => ({ ca: acc.ca + r.ca, benef: acc.benef + r.benef, cost: acc.cost + r.cost, count: acc.count + r.count }),
      { ca: 0, benef: 0, cost: 0, count: 0 },
    );
  }, [history]);

  const perCommercial = useMemo(() => {
    const map = new Map<string, { name: string; ca: number; benef: number; count: number }>();
    for (const o of orders) {
      const emp = employees.find((e) => e.id === o.commercialId);
      const name = emp?.fullName ?? "—";
      const cur = map.get(o.commercialId) ?? { name, ca: 0, benef: 0, count: 0 };
      cur.ca += o.total;
      cur.benef += o.total - o.totalInitial;
      cur.count += 1;
      map.set(o.commercialId, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.ca - a.ca);
  }, [orders, employees]);

  const exportHistoryCsv = () => {
    const rows = [["Date", "Commandes", "CA (DZD)", "Coût (DZD)", "Bénéfice (DZD)"]];
    for (const r of history) rows.push([r.dateKey, String(r.count), String(r.ca), String(r.cost), String(r.benef)]);
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `historique-financier-${range}j.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Historique exporté");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comptabilité & Historique</h1>
          <p className="text-sm text-slate-500">Suivi quotidien du chiffre d'affaires, des coûts et des bénéfices.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            {([7, 30, 90] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  range === r ? "bg-[#A50034] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {r} jours
              </button>
            ))}
          </div>
          <button
            onClick={exportHistoryCsv}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800"
          >
            <FileDown className="h-4 w-4" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Chiffre d'affaires" value={fmtDA(ca)} sub={`${fmtDA(rangeTotals.ca)} sur ${range}j`} icon={Wallet} color="text-blue-600 bg-blue-50" />
        <Kpi label="Coût initial" value={fmtDA(cost)} sub={`${fmtDA(rangeTotals.cost)} sur ${range}j`} icon={Receipt} color="text-slate-700 bg-slate-100" />
        <Kpi label="Bénéfices" value={fmtDA(benef)} sub={`${fmtDA(rangeTotals.benef)} sur ${range}j`} icon={TrendingUp} color="text-[#A50034] bg-red-50" />
        <Kpi label="Marge" value={`${margin.toFixed(1)} %`} sub={`${rangeTotals.count} commandes / ${range}j`} icon={margin >= 25 ? TrendingUp : TrendingDown} color="text-green-700 bg-green-50" />
      </div>

      {/* Daily history chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Évolution quotidienne</h2>
            <p className="text-xs text-slate-500">CA vs bénéfice sur les {range} derniers jours</p>
          </div>
          <Calendar className="h-5 w-5 text-slate-400" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="gCa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBenef" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A50034" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A50034" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmtDA(v)} labelClassName="text-xs" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="ca" name="CA" stroke="#1a1a1a" fill="url(#gCa)" strokeWidth={2} />
              <Area type="monotone" dataKey="benef" name="Bénéfice" stroke="#A50034" fill="url(#gBenef)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two column: top commerciaux + history table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold mb-4">Classement des commerciaux (CA)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perCommercial}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtDA(v)} />
                <Bar dataKey="ca" radius={[8, 8, 0, 0]}>
                  {perCommercial.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#A50034" : "#1a1a1a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DataTable
          title="Historique journalier"
          rows={[...history].reverse().map((r) => ({ ...r, id: r.dateKey }))}
          columns={[
            { key: "date", header: "Date", render: (r) => <span className="font-medium">{r.dateLabel}</span>, searchValue: (r) => r.dateLabel },
            { key: "count", header: "Cmd", render: (r) => <span className="font-mono">{r.count}</span> },
            { key: "ca", header: "CA", render: (r) => <span className="font-semibold">{fmtDA(r.ca)}</span> },
            { key: "benef", header: "Bénéfice", render: (r) => <span className={`font-semibold ${r.benef > 0 ? "text-[#A50034]" : "text-slate-400"}`}>{fmtDA(r.benef)}</span> },
          ]}
        />
      </div>

      <AIPanel kpis={{ ca, benef, cost, margin: margin.toFixed(1), perCommercial, history }} />
    </div>
  );
}

function Kpi({
  label, value, sub, icon: Icon, color,
}: { label: string; value: string; sub?: string; icon: typeof Wallet; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function AIPanel({ kpis }: { kpis: unknown }) {
  const fn = useServerFn(analyzeFinance);
  const [q, setQ] = useState("Analyse mes performances et propose des actions concrètes pour augmenter la marge.");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const ask = async () => {
    setBusy(true);
    setAnswer(null);
    try {
      const r = await fn({ data: { question: q, kpis: JSON.stringify(kpis) } });
      setAnswer(r.answer);
    } catch (e) {
      toast.error("Échec analyse IA", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#A50034] text-white rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5" />
        <h2 className="font-semibold">Assistant comptable IA</h2>
      </div>
      <textarea
        value={q}
        onChange={(e) => setQ(e.target.value)}
        rows={2}
        className="w-full p-3 rounded-lg text-slate-900 text-sm outline-none"
        placeholder="Posez votre question…"
      />
      <button onClick={ask} disabled={busy} className="mt-3 bg-white text-[#A50034] px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Analyser
      </button>
      {answer && (
        <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-4 text-sm whitespace-pre-wrap">{answer}</div>
      )}
    </div>
  );
}
