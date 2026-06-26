import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useErp, fmtDA } from "@/lib/erp/store";
import { analyzeFinance } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/erp/finance")({ component: FinancePage });

function FinancePage() {
  const { orders, employees } = useErp();
  const ca = orders.reduce((s, o) => s + o.total, 0);
  const benef = orders.reduce((s, o) => s + (o.total - o.totalInitial), 0);
  const cost = ca - benef;

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard financier</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Chiffre d'affaires" value={fmtDA(ca)} accent="text-blue-600 bg-blue-50" />
        <Kpi label="Coût initial" value={fmtDA(cost)} accent="text-slate-700 bg-slate-100" />
        <Kpi label="Bénéfices" value={fmtDA(benef)} accent="text-[#A50034] bg-red-50" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold mb-4">Classement des commerciaux (CA)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perCommercial}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
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

      <AIPanel kpis={{ ca, benef, cost, perCommercial }} />
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-2 px-3 py-1 rounded-lg inline-block ${accent}`}>{value}</div>
    </div>
  );
}

function AIPanel({ kpis }: { kpis: unknown }) {
  const fn = useServerFn(analyzeFinance);
  const [q, setQ] = useState("Quels commerciaux performent le mieux ? Suggère des actions.");
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
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#A50034] text-white rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5" />
        <h2 className="font-semibold">Assistant financier IA</h2>
      </div>
      <textarea
        value={q}
        onChange={(e) => setQ(e.target.value)}
        rows={2}
        className="w-full p-3 rounded-lg text-slate-900 text-sm outline-none"
        placeholder="Posez votre question…"
      />
      <button onClick={ask} disabled={busy} className="mt-3 bg-white text-[#A50034] px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Analyser
      </button>
      {answer && (
        <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-4 text-sm whitespace-pre-wrap">{answer}</div>
      )}
    </div>
  );
}
