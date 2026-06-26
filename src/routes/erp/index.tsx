import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import { useErp, fmtDA } from "@/lib/erp/store";
import {
  Package, ShoppingCart, Users, Wallet, TrendingUp, AlertTriangle,
  ArrowUpRight, Plus, CheckCircle2, Clock, Truck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  AreaChart, Area, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/erp/")({
  component: Dashboard,
});

function Dashboard() {
  const { stock, orders, clients, role, employees } = useErp();
  const navigate = useNavigate();

  const dashboardRoles = ["comptable", "admin"];
  const hasAccess = dashboardRoles.includes(role);

  useEffect(() => {
    if (!hasAccess) {
      if (role === "commercial" || role === "depot") {
        navigate({ to: "/erp/stock" });
      } else if (role === "vendeur") {
        navigate({ to: "/erp/commandes" });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [role, hasAccess, navigate]);

  if (!hasAccess) {
    return null;
  }

  const ca = orders.reduce((s, o) => s + o.total, 0);
  const benef = orders.reduce((s, o) => s + (o.total - o.totalInitial), 0);
  const lowStock = stock.filter((s) => s.stock <= 2);

  // Last 30 days for area chart
  const trend = useMemo(() => {
    const days = 30;
    const now = new Date();
    const map = new Map<string, { day: string; ca: number; benef: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { day: d.toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" }), ca: 0, benef: 0 });
    }
    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const row = map.get(key);
      if (!row) continue;
      row.ca += o.total;
      row.benef += o.total - o.totalInitial;
    }
    return Array.from(map.values());
  }, [orders]);

  // Monthly bars (last 6 months)
  const monthly = useMemo(() => {
    const months: { name: string; ca: number; benef: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("fr-DZ", { month: "short" }).toUpperCase().replace(".", "");
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      let ca = 0, benef = 0;
      for (const o of orders) {
        const od = new Date(o.createdAt);
        if (`${od.getFullYear()}-${od.getMonth()}` === ym) {
          ca += o.total;
          benef += o.total - o.totalInitial;
        }
      }
      months.push({ name: label, ca, benef });
    }
    return months;
  }, [orders]);

  const bestMonth = useMemo(() => {
    let idx = 0;
    monthly.forEach((m, i) => { if (m.ca > monthly[idx].ca) idx = i; });
    return idx;
  }, [monthly]);

  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusIcon = (s: string) => {
    if (s === "Livré") return { icon: CheckCircle2, color: "text-green-600 bg-green-50" };
    if (s === "En cours de livraison") return { icon: Truck, color: "text-blue-600 bg-blue-50" };
    return { icon: Clock, color: "text-amber-600 bg-amber-50" };
  };

  const today = new Date();
  const startRange = new Date(today); startRange.setDate(today.getDate() - 29);
  const dateRange = `${startRange.toLocaleDateString("fr-DZ", { day: "2-digit", month: "short" })} – ${today.toLocaleDateString("fr-DZ", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      {/* Welcome bar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Bon retour, <span className="text-[#A50034]">John Doe</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rôle actif : <span className="font-semibold text-slate-700 capitalize">{role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#A50034]" />
            {dateRange}
          </div>
          <Link
            to="/erp/commandes"
            className="flex items-center gap-2 bg-[#A50034] text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-[#8a002b]"
          >
            <Plus className="h-3.5 w-3.5" /> Nouvelle commande
          </Link>
        </div>
      </div>

      {/* Top row: CA card + bar chart + Balance card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CA hero card */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chiffre d'affaires</div>
              <div className="text-[11px] text-slate-400">Total cumulé</div>
            </div>
            <button className="h-7 w-7 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#A50034] text-white p-5 flex-1 flex flex-col justify-between shadow-lg shadow-[#A50034]/20">
            <div className="flex items-start justify-between">
              <div className="text-xs uppercase tracking-widest opacity-80">LG-morchid</div>
              <Wallet className="h-5 w-5 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-bold">{fmtDA(ca)}</div>
              <div className="text-[10px] tracking-[0.3em] opacity-70 mt-3">●●●● {String(orders.length).padStart(4, "0")}</div>
              <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                <span>{clients.length} CLIENTS</span>
                <span>EXP {String(today.getMonth() + 1).padStart(2, "0")}/{String(today.getFullYear()).slice(-2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-lg p-3">
            <div>
              <div className="text-[11px] text-slate-500">Revenu hebdo</div>
              <div className="text-sm font-bold text-slate-900">+{fmtDA(monthly.at(-1)?.benef ?? 0)}</div>
            </div>
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">+12.8%</span>
          </div>
        </div>

        {/* Monthly bar chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold">Taux d'engagement</div>
              <div className="text-[11px] text-slate-400">CA par mois</div>
            </div>
            <div className="flex items-center bg-slate-50 rounded-full p-1 text-[11px] font-semibold">
              <span className="px-3 py-1 text-slate-500">Mensuel</span>
              <span className="px-3 py-1 bg-[#A50034] text-white rounded-full">Annuel</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmtDA(v)} cursor={{ fill: "#fde8ee" }} />
                <Bar dataKey="ca" radius={[12, 12, 12, 12]}>
                  {monthly.map((_, i) => (
                    <Cell key={i} fill={i === bestMonth ? "#A50034" : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bénéfices area card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bénéfices</div>
              <div className="text-[11px] text-slate-400">30 derniers jours</div>
            </div>
            <button className="h-7 w-7 rounded-md bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-3">{fmtDA(benef)}</div>
          <div className="h-32 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A50034" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#A50034" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip formatter={(v: number) => fmtDA(v)} />
                <Area type="monotone" dataKey="benef" stroke="#A50034" fill="url(#dashArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mt-3">
            <Link to="/erp/finance" className="flex-1 bg-[#A50034] text-white text-xs font-semibold rounded-full px-4 py-2 flex items-center justify-center gap-1">
              Détails <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link to="/erp/factures" className="flex-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full px-4 py-2 flex items-center justify-center">
              Factures
            </Link>
          </div>
        </div>
      </div>

      {/* Second row: history table + side cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Historique des commandes</div>
              <div className="text-[11px] text-slate-400">Activité récente</div>
            </div>
            <Link to="/erp/commandes" className="text-xs text-[#A50034] font-semibold flex items-center gap-1">
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="text-left py-2 font-semibold">Réf / Client</th>
                  <th className="text-left py-2 font-semibold">Date</th>
                  <th className="text-left py-2 font-semibold">Statut</th>
                  <th className="text-right py-2 font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => {
                  const s = statusIcon(o.status);
                  const SIcon = s.icon;
                  return (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3">
                        <div className="font-medium text-slate-900">{o.client.firstName} {o.client.lastName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{o.ref}</div>
                      </td>
                      <td className="py-3 text-slate-600">{new Date(o.createdAt).toLocaleDateString("fr-DZ")}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                          <SIcon className="h-3 w-3" /> {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold">{fmtDA(o.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <MiniKpi label="Articles en stock" value={stock.reduce((s, p) => s + p.stock, 0)} sub={`${stock.length} références`} icon={Package} accent="bg-blue-50 text-blue-600" />
          <MiniKpi label="Commandes totales" value={orders.length} sub={`${employees.length} employés actifs`} icon={ShoppingCart} accent="bg-amber-50 text-amber-600" />
          <MiniKpi label="Clients" value={clients.length} sub="Standard + convention" icon={Users} accent="bg-purple-50 text-purple-600" />

          {/* Stock alerts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-[#A50034]" /> Alertes de stock
            </h2>
            {lowStock.length === 0 && <div className="text-xs text-slate-500">Aucun produit en alerte.</div>}
            <ul className="space-y-2">
              {lowStock.slice(0, 4).map((p) => (
                <li key={p.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className={`font-semibold whitespace-nowrap ${p.stock === 0 ? "text-[#A50034]" : "text-amber-600"}`}>
                    {p.stock === 0 ? "Rupture" : `${p.stock} restants`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKpi({
  label, value, sub, icon: Icon, accent,
}: { label: string; value: string | number; sub: string; icon: typeof Package; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-[11px] text-slate-500 truncate">{sub}</div>
      </div>
      <TrendingUp className="h-4 w-4 text-green-500" />
    </div>
  );
}
