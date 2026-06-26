import { createFileRoute } from "@tanstack/react-router";
import { useErp, fmtDA } from "@/lib/erp/store";
import { Package, ShoppingCart, Users, Wallet, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/erp/")({
  component: Dashboard,
});

function Dashboard() {
  const { stock, orders, clients, role } = useErp();
  const ca = orders.reduce((s, o) => s + o.total, 0);
  const benef = orders.reduce((s, o) => s + (o.total - o.totalInitial), 0);
  const lowStock = stock.filter((s) => s.stock <= 2);

  const kpis = [
    { label: "Total Articles", value: stock.length, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Commandes", value: orders.length, icon: ShoppingCart, color: "bg-green-50 text-green-600" },
    { label: "Clients", value: clients.length, icon: Users, color: "bg-amber-50 text-amber-600" },
    { label: "CA total", value: fmtDA(ca), icon: Wallet, color: "bg-[#fde8ee] text-[#A50034]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble — rôle actif : <span className="font-semibold text-[#A50034]">{role}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">{k.label}</div>
              <div className="text-2xl font-bold mt-1">{k.value}</div>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${k.color}`}>
              <k.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold mb-4">Bénéfices estimés</h2>
          <div className="text-3xl font-bold text-[#A50034]">{fmtDA(benef)}</div>
          <div className="text-xs text-slate-500 mt-1">∑(Prix total − Prix initial) sur toutes les commandes</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#A50034]" /> Alertes de stock
          </h2>
          {lowStock.length === 0 && <div className="text-sm text-slate-500">Aucun produit en alerte.</div>}
          <ul className="space-y-2">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <span>{p.name}</span>
                <span className={`font-semibold ${p.stock === 0 ? "text-[#A50034]" : "text-amber-600"}`}>
                  {p.stock === 0 ? "Rupture" : `${p.stock} restants`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
