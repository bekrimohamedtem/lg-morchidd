import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useErp, fmtDA } from "@/lib/erp/store";
import { ROLES } from "@/lib/erp/types";
import { Mail, Phone, Calendar, Shield, MapPin, Briefcase, TrendingUp, Award, ShoppingBag, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/erp/profile")({ component: ProfilePage });

function ProfilePage() {
  const { role, employees, orders } = useErp();
  const me = employees.find((e) => e.role === role) ?? employees[employees.length - 1];
  const myOrders = useMemo(() => orders.filter((o) => o.commercialId === me.id), [orders, me.id]);

  const now = new Date();
  const isThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  const thisMonthOrders = myOrders.filter((o) => isThisMonth(new Date(o.createdAt)));
  const thisMonthCa = thisMonthOrders.reduce((s, o) => s + o.total, 0);
  const thisMonthBenef = thisMonthOrders.reduce((s, o) => s + (o.total - o.totalInitial), 0);

  // Last 6 months performance
  const monthly = useMemo(() => {
    const months: { name: string; ca: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("fr-DZ", { month: "short" }).replace(".", "");
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      let ca = 0, count = 0;
      for (const o of myOrders) {
        const od = new Date(o.createdAt);
        if (`${od.getFullYear()}-${od.getMonth()}` === ym) { ca += o.total; count += 1; }
      }
      months.push({ name: label, ca, count });
    }
    return months;
  }, [myOrders, now]);

  const bestIdx = monthly.reduce((b, m, i, arr) => (m.ca > arr[b].ca ? i : b), 0);
  const isCommercial = me.role === "commercial";
  const initials = me.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#4a0019] to-[#A50034] rounded-3xl p-8 text-white overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -right-40 -bottom-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute right-8 top-8 grid grid-cols-6 gap-1.5 opacity-30">
          {Array.from({ length: 24 }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-white" />)}
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-white to-slate-200 text-[#A50034] text-5xl font-black flex items-center justify-center shadow-2xl rotate-3">
              {initials}
            </div>
            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-green-500 border-4 border-[#A50034] flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Compte vérifié — En ligne
            </div>
            <h1 className="text-4xl font-black tracking-tight">{me.fullName}</h1>
            <p className="text-white/90 mt-2 flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" /> {ROLES.find((r) => r.id === me.role)?.label} chez LG-morchid
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"><Mail className="h-3 w-3" /> {me.email}</span>
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"><Phone className="h-3 w-3" /> {me.phone}</span>
              <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Alger, Algérie</span>
            </div>
          </div>
        </div>
      </div>

      {/* Commercial: monthly performance */}
      {isCommercial && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={ShoppingBag} color="from-blue-500 to-blue-700"
              label="Ventes ce mois"
              value={String(thisMonthOrders.length)}
              sub={`${myOrders.length} au total`}
            />
            <StatCard
              icon={Target} color="from-[#A50034] to-[#4a0019]"
              label="CA ce mois"
              value={fmtDA(thisMonthCa)}
              sub={`${fmtDA(thisMonthBenef)} de bénéfice`}
            />
            <StatCard
              icon={Award} color="from-amber-500 to-orange-600"
              label="Meilleur mois"
              value={monthly[bestIdx]?.name?.toUpperCase() ?? "—"}
              sub={fmtDA(monthly[bestIdx]?.ca ?? 0)}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#A50034]" /> Performance mensuelle</h2>
                <p className="text-xs text-slate-500">CA généré sur les 6 derniers mois</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => fmtDA(v)} cursor={{ fill: "#fde8ee" }} />
                  <Bar dataKey="ca" radius={[10, 10, 10, 10]}>
                    {monthly.map((_, i) => <Cell key={i} fill={i === bestIdx ? "#A50034" : i === monthly.length - 1 ? "#1a1a1a" : "#e2e8f0"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-3">
              {monthly.map((m, i) => (
                <div key={i} className={`text-center p-2 rounded-lg ${i === bestIdx ? "bg-[#fde8ee]" : "bg-slate-50"}`}>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">{m.name}</div>
                  <div className="text-sm font-bold">{m.count}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2 space-y-2">
          <h2 className="font-semibold text-lg mb-2">Informations</h2>
          <InfoRow icon={Mail} label="Email" value={me.email} />
          <InfoRow icon={Phone} label="Téléphone" value={me.phone} />
          <InfoRow icon={Calendar} label="Date d'embauche" value={new Date(me.hiredAt).toLocaleDateString("fr-DZ", { day: "numeric", month: "long", year: "numeric" })} />
          <InfoRow icon={MapPin} label="Lieu" value="Alger, Algérie" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold text-lg">Récapitulatif</h2>
          <Stat label="Commandes traitées" value={myOrders.length} />
          {isCommercial && <Stat label="Ce mois" value={thisMonthOrders.length} />}
          <Stat label="Statut" value="Actif" />
          <Stat label="Rôle" value={ROLES.find((r) => r.id === me.role)?.label ?? "—"} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value, sub }: { icon: typeof Mail; color: string; label: string; value: string; sub: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} text-white p-5 shadow-lg`}>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full" />
      <Icon className="h-6 w-6 opacity-90" />
      <div className="text-[11px] font-semibold uppercase tracking-wider mt-3 opacity-90">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
      <div className="text-[11px] opacity-80 mt-1">{sub}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition">
      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#fde8ee] to-[#fad0db] text-[#A50034] flex items-center justify-center shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
