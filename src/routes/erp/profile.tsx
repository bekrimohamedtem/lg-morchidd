import { createFileRoute } from "@tanstack/react-router";
import { useErp } from "@/lib/erp/store";
import { ROLES } from "@/lib/erp/types";
import { Mail, Phone, Calendar, Shield, MapPin, Briefcase } from "lucide-react";

export const Route = createFileRoute("/erp/profile")({ component: ProfilePage });

function ProfilePage() {
  const { role, employees, orders } = useErp();
  const me = employees.find((e) => e.role === role) ?? employees[employees.length - 1];
  const myOrders = orders.filter((o) => o.commercialId === me.id);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#A50034] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -right-32 -bottom-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="h-28 w-28 rounded-full bg-white text-[#A50034] text-4xl font-bold flex items-center justify-center shadow-2xl border-4 border-white/20">
            {me.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{me.fullName}</h1>
            <p className="text-white/80 mt-1 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> {ROLES.find((r) => r.id === me.role)?.label} chez LG-morchid
            </p>
            <div className="mt-3 inline-flex items-center gap-1 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs">
              <Shield className="h-3 w-3" /> Compte vérifié
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-lg">Informations</h2>
          <InfoRow icon={Mail} label="Email" value={me.email} />
          <InfoRow icon={Phone} label="Téléphone" value={me.phone} />
          <InfoRow icon={Calendar} label="Date d'embauche" value={new Date(me.hiredAt).toLocaleDateString("fr-DZ", { day: "numeric", month: "long", year: "numeric" })} />
          <InfoRow icon={MapPin} label="Lieu" value="Alger, Algérie" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-lg">Statistiques</h2>
          <Stat label="Commandes traitées" value={myOrders.length} />
          <Stat label="Statut" value="Actif" />
          <Stat label="Permissions" value={ROLES.find((r) => r.id === me.role)?.label ?? "—"} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50">
      <div className="h-10 w-10 rounded-full bg-[#fde8ee] text-[#A50034] flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
