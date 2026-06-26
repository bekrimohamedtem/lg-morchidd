import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useErp, fmtDA } from "@/lib/erp/store";
import { analyzeFinance } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Send, Calendar, TrendingUp, Bot, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/erp/insights")({ component: InsightsPage });

type Msg = { role: "user" | "assistant"; content: string };
type Period = "today" | "month" | "year" | "all";

function InsightsPage() {
  const { orders, stock, clients, employees } = useErp();
  const [period, setPeriod] = useState<Period>("month");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const fn = useServerFn(analyzeFinance);

  const stats = useMemo(() => computeStats(orders, period), [orders, period]);
  const compareStats = useMemo(() => computeStats(orders, period, true), [orders, period]);

  const context = useMemo(() => ({
    periode: period,
    aujourdhui: new Date().toISOString().slice(0, 10),
    periode_actuelle: stats,
    periode_precedente_comparaison: compareStats,
    stock: {
      total_references: stock.length,
      total_unites: stock.reduce((a, s) => a + s.stock, 0),
      ruptures: stock.filter((s) => s.stock === 0).map((s) => s.name),
      faibles: stock.filter((s) => s.stock > 0 && s.stock <= 2).map((s) => `${s.name} (${s.stock})`),
      par_depot: Object.fromEntries(Array.from(new Set(stock.map((s) => s.depot))).map((d) => [d, stock.filter((s) => s.depot === d).length])),
    },
    clients: { total: clients.length, conventionnes: clients.filter((c) => c.type === "convention").length },
    employes: employees.length,
    top_produits_periode: stats.top_produits,
    repartition_canal_periode: stats.canal,
    ventes_par_commercial_periode: stats.par_commercial.map((p) => ({ ...p, name: employees.find((e) => e.id === p.commercialId)?.fullName ?? p.commercialId })),
  }), [period, stats, compareStats, stock, clients, employees]);

  const ask = async (question: string) => {
    if (!question.trim()) return;
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fn({ data: { question, kpis: JSON.stringify(context).slice(0, 7500) } });
      setMsgs((m) => [...m, { role: "assistant", content: r.answer }]);
    } catch (e) {
      toast.error("Échec analyse IA", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const presets = [
    "Fais-moi un résumé clair de cette période et compare avec la précédente.",
    "Quels sont mes meilleurs produits et qui devrais-je réapprovisionner ?",
    "Quel canal (site/showroom) performe le mieux et pourquoi ?",
    "Quel commercial a généré le plus de bénéfice ?",
    "Quelles actions concrètes pour augmenter ma marge le mois prochain ?",
  ];

  const periodLabel: Record<Period, string> = {
    today: "Aujourd'hui", month: "Ce mois-ci", year: "Cette année", all: "Toutes périodes",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-[#A50034]" /> Savoir plus — Assistant IA
        </h1>
        <p className="text-sm text-slate-500 mt-1">L'IA analyse votre base : ventes, stock, clients, dépôts. Posez n'importe quelle question.</p>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 text-[#A50034]" />
        <span className="text-sm font-semibold mr-2">Période :</span>
        {(["today", "month", "year", "all"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${period === p ? "bg-[#A50034] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {periodLabel[p]}
          </button>
        ))}
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiBlock label="Commandes" value={String(stats.count)} delta={stats.count - compareStats.count} suffix="" />
        <KpiBlock label="Chiffre d'affaires" value={fmtDA(stats.ca)} delta={stats.ca - compareStats.ca} suffix=" DA" money />
        <KpiBlock label="Bénéfice" value={fmtDA(stats.benef)} delta={stats.benef - compareStats.benef} suffix=" DA" money />
        <KpiBlock label="Marge" value={`${stats.margin.toFixed(1)}%`} delta={stats.margin - compareStats.margin} suffix="pt" />
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ minHeight: 500 }}>
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-[#1a1a1a] to-[#A50034] text-white flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">Assistant comptable IA</span>
          <span className="ml-auto text-[11px] opacity-80">Données live · {periodLabel[period]}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {msgs.length === 0 && (
            <div className="text-center py-10">
              <Sparkles className="h-10 w-10 text-[#A50034] mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">Choisissez une question rapide ou tapez la vôtre :</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {presets.map((p) => (
                  <button key={p} onClick={() => ask(p)}
                    className="text-xs bg-white border border-slate-200 hover:border-[#A50034] hover:text-[#A50034] px-3 py-2 rounded-full">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#A50034] flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-[#A50034] text-white rounded-br-sm" : "bg-white border border-slate-200 rounded-bl-sm"
              }`}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <UserIcon className="h-4 w-4 text-slate-700" />
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#A50034] flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#A50034]" /> Analyse en cours…
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 flex gap-2 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !busy) ask(input); }}
            placeholder="Posez votre question : 'Combien j'ai vendu aujourd'hui ?' …"
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-full text-sm outline-none focus:border-[#A50034]"
          />
          <button onClick={() => ask(input)} disabled={busy || !input.trim()}
            className="bg-[#A50034] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Send className="h-4 w-4" /> Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiBlock({ label, value, delta, money }: { label: string; value: string; delta: number; suffix?: string; money?: boolean }) {
  const positive = delta >= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className={`text-xs mt-1 flex items-center gap-1 font-semibold ${positive ? "text-green-600" : "text-[#A50034]"}`}>
        <TrendingUp className={`h-3 w-3 ${positive ? "" : "rotate-180"}`} />
        {positive ? "+" : ""}{money ? fmtDA(Math.round(delta)) : delta.toFixed(1)} vs précédent
      </div>
    </div>
  );
}

function computeStats(orders: ReturnType<typeof useErp.getState>["orders"], period: Period, previous = false) {
  const now = new Date();
  let start: Date, end: Date;
  if (period === "today") {
    start = new Date(now); start.setHours(0, 0, 0, 0);
    end = new Date(now); end.setHours(23, 59, 59, 999);
    if (previous) { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth() - (previous ? 1 : 0), 1);
    end = new Date(now.getFullYear(), now.getMonth() - (previous ? 1 : 0) + 1, 0, 23, 59, 59);
  } else if (period === "year") {
    start = new Date(now.getFullYear() - (previous ? 1 : 0), 0, 1);
    end = new Date(now.getFullYear() - (previous ? 1 : 0), 11, 31, 23, 59, 59);
  } else {
    start = new Date(0);
    end = new Date(now);
    if (previous) end.setTime(0);
  }
  const filtered = orders.filter((o) => {
    const d = new Date(o.createdAt).getTime();
    return d >= start.getTime() && d <= end.getTime();
  });
  const ca = filtered.reduce((s, o) => s + o.total, 0);
  const cost = filtered.reduce((s, o) => s + o.totalInitial, 0);
  const benef = ca - cost;
  const margin = ca > 0 ? (benef / ca) * 100 : 0;

  const canalMap = new Map<string, number>();
  for (const o of filtered) canalMap.set(o.channel, (canalMap.get(o.channel) ?? 0) + o.total);
  const canal = Object.fromEntries(canalMap);

  const prodMap = new Map<string, { qty: number; ca: number }>();
  for (const o of filtered) for (const it of o.items) {
    const cur = prodMap.get(it.productId) ?? { qty: 0, ca: 0 };
    cur.qty += it.quantity;
    prodMap.set(it.productId, cur);
  }
  const top_produits = Array.from(prodMap.entries()).map(([id, v]) => ({ productId: id, qte_vendue: v.qty })).sort((a, b) => b.qte_vendue - a.qte_vendue).slice(0, 5);

  const commMap = new Map<string, { ca: number; count: number }>();
  for (const o of filtered) {
    const cur = commMap.get(o.commercialId) ?? { ca: 0, count: 0 };
    cur.ca += o.total; cur.count += 1;
    commMap.set(o.commercialId, cur);
  }
  const par_commercial = Array.from(commMap.entries()).map(([commercialId, v]) => ({ commercialId, ca: v.ca, count: v.count }));

  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), count: filtered.length, ca, cost, benef, margin, canal, top_produits, par_commercial };
}
