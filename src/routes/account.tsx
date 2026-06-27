import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  User as UserIcon, Mail, Phone, Shield, MapPin, Package, Download,
  Lock, KeyRound, Plus, Trash2, LogOut, AlertTriangle, BadgeCheck,
  Edit3, Save, X, Clock, Truck, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Mon compte — LG-morchid" }] }),
  component: AccountPage,
});

type Address = { id: string; label: string; line: string; city: string };
type Order = {
  id: string;
  created_at: string;
  status: string;
  quantity: number;
  product: { name: string; price: number; image_url: string | null } | null;
};

const STATUS_FLOW = [
  { key: "pending", label: "En préparation", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "shipping", label: "En cours de livraison", icon: Truck, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "delivered", label: "Livré", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [editName, setEditName] = useState(false);
  const [phone, setPhone] = useState("");
  const [editPhone, setEditPhone] = useState(false);
  const [convention, setConvention] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newAddr, setNewAddr] = useState<Omit<Address, "id">>({ label: "", line: "", city: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));

    // localStorage extras (phone, convention, addresses)
    setPhone(localStorage.getItem(`lg.phone.${user.id}`) ?? "");
    setConvention(localStorage.getItem(`lg.conv.${user.id}`) === "1");
    try {
      setAddresses(JSON.parse(localStorage.getItem(`lg.addr.${user.id}`) ?? "[]"));
    } catch { setAddresses([]); }

    supabase
      .from("preorders")
      .select("id, created_at, status, quantity, product:products(name, price, image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as unknown as Order[]) ?? []));
  }, [user]);

  const initials = useMemo(() => {
    const src = fullName || user?.email || "?";
    return src.split(/[\s@.]/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  }, [fullName, user]);

  async function saveName() {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
    if (error) toast.error(error.message);
    else { toast.success("Nom mis à jour"); setEditName(false); }
  }

  function savePhone() {
    if (!user) return;
    localStorage.setItem(`lg.phone.${user.id}`, phone);
    toast.success("Téléphone enregistré");
    setEditPhone(false);
  }

  function toggleConvention() {
    if (!user) return;
    const next = !convention;
    setConvention(next);
    localStorage.setItem(`lg.conv.${user.id}`, next ? "1" : "0");
    toast.success(next ? "Statut Convention activé" : "Statut Standard rétabli");
  }

  async function resetPassword() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Email de réinitialisation envoyé");
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function persistAddrs(list: Address[]) {
    if (!user) return;
    setAddresses(list);
    localStorage.setItem(`lg.addr.${user.id}`, JSON.stringify(list));
  }

  function addAddr() {
    if (!newAddr.label || !newAddr.line) { toast.error("Libellé et adresse requis"); return; }
    persistAddrs([...addresses, { ...newAddr, id: crypto.randomUUID() }]);
    setNewAddr({ label: "", line: "", city: "" });
    setAddOpen(false);
    toast.success("Adresse ajoutée");
  }

  function removeAddr(id: string) {
    persistAddrs(addresses.filter((a) => a.id !== id));
  }

  function downloadInvoice(o: Order, kind: "Facture" | "Proforma") {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor("#A50034");
    doc.text("LG-morchid", 14, 20);
    doc.setFontSize(13); doc.setTextColor("#111");
    doc.text(`${kind} #${o.id.slice(0, 8).toUpperCase()}`, 14, 30);
    doc.setFontSize(10);
    doc.text(`Date : ${new Date(o.created_at).toLocaleDateString("fr-DZ")}`, 14, 38);
    doc.text(`Client : ${fullName || user?.email}`, 14, 44);
    doc.text(`Email : ${user?.email}`, 14, 50);
    if (phone) doc.text(`Téléphone : ${phone}`, 14, 56);
    const total = (o.product?.price ?? 0) * o.quantity;
    autoTable(doc, {
      startY: 64,
      head: [["Article", "Qté", "PU", "Total"]],
      body: [[o.product?.name ?? "—", String(o.quantity), `${o.product?.price ?? 0} DA`, `${total} DA`]],
      headStyles: { fillColor: [165, 0, 52] },
    });
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.text(`Total TTC : ${total} DA`, 14, y);
    doc.setFontSize(9); doc.setTextColor("#666");
    doc.text("Merci pour votre confiance — LG-morchid", 14, y + 10);
    doc.save(`${kind}-${o.id.slice(0, 8)}.pdf`);
  }

  async function deleteAccount() {
    if (!user) return;
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    localStorage.removeItem(`lg.phone.${user.id}`);
    localStorage.removeItem(`lg.conv.${user.id}`);
    localStorage.removeItem(`lg.addr.${user.id}`);
    toast.success("Compte supprimé");
    navigate({ to: "/", replace: true });
  }

  if (loading || !user) return <div className="p-12 text-center text-muted-foreground">…</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        {/* HEADER CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a1a] via-[#4a0019] to-[#A50034] text-white shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -right-40 -bottom-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="relative p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-white to-slate-200 text-[#A50034] text-4xl font-black flex items-center justify-center shadow-2xl rotate-3">
              {initials || <UserIcon className="h-10 w-10" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button
                  onClick={toggleConvention}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition ${
                    convention ? "bg-amber-400 text-black" : "bg-white/15 backdrop-blur"
                  }`}
                >
                  {convention ? <BadgeCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  {convention ? "Sous Convention" : "Client Standard"}
                </button>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> En ligne
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight truncate">
                {fullName || "Bienvenue"}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> {user.email}</span>
                {phone && <span className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"><Phone className="h-3 w-3" /> {phone}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ORDERS */}
        <Card icon={Package} title="Historique des commandes" subtitle="Suivez vos achats et téléchargez vos documents">
          {orders.length === 0 ? (
            <Empty label="Aucune commande pour le moment." cta={<Link to="/" className="text-[#A50034] font-semibold hover:underline">Découvrir le catalogue →</Link>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {orders.map((o) => {
                const step = STATUS_FLOW.find((s) => s.key === o.status) ?? STATUS_FLOW[0];
                const Sicon = step.icon;
                const total = (o.product?.price ?? 0) * o.quantity;
                return (
                  <li key={o.id} className="py-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {o.product?.image_url && <img src={o.product.image_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{o.product?.name ?? "Produit"}</div>
                      <div className="text-xs text-slate-500">
                        #{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString("fr-DZ")} · Qté {o.quantity}
                      </div>
                      <div className={`mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${step.color}`}>
                        <Sicon className="h-3 w-3" /> {step.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg">{total.toLocaleString("fr-DZ")} DA</div>
                      <div className="flex gap-1.5 mt-1.5 justify-end">
                        <button onClick={() => downloadInvoice(o, "Facture")} className="inline-flex items-center gap-1 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-[#A50034] transition">
                          <Download className="h-3 w-3" /> Facture
                        </button>
                        <button onClick={() => downloadInvoice(o, "Proforma")} className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-[#A50034] transition">
                          <Download className="h-3 w-3" /> Proforma
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PERSONAL INFO + SECURITY */}
          <Card icon={UserIcon} title="Informations personnelles" subtitle="Modifiez vos coordonnées et sécurisez votre compte">
            <div className="space-y-3">
              <EditableRow
                icon={UserIcon} label="Nom complet" value={fullName} editing={editName}
                onEdit={() => setEditName(true)} onCancel={() => setEditName(false)}
                onChange={setFullName} onSave={saveName}
              />
              <Row icon={Mail} label="Email" value={user.email ?? "—"} />
              <EditableRow
                icon={Phone} label="Téléphone" value={phone || "—"} editing={editPhone}
                onEdit={() => setEditPhone(true)} onCancel={() => setEditPhone(false)}
                onChange={setPhone} onSave={savePhone} placeholder="+213…"
              />
              <button
                onClick={resetPassword}
                className="w-full mt-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#fde8ee] transition group"
              >
                <span className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-white text-[#A50034] flex items-center justify-center shadow-sm">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <span className="text-left">
                    <div className="text-sm font-semibold">Réinitialiser mon mot de passe</div>
                    <div className="text-xs text-slate-500">Un email sécurisé vous sera envoyé</div>
                  </span>
                </span>
                <Lock className="h-4 w-4 text-slate-400 group-hover:text-[#A50034]" />
              </button>
            </div>
          </Card>

          {/* ADDRESS BOOK */}
          <Card icon={MapPin} title="Carnet d'adresses" subtitle="Vos lieux de livraison favoris"
            action={
              <button onClick={() => setAddOpen((v) => !v)} className="inline-flex items-center gap-1 text-xs bg-[#A50034] text-white px-3 py-1.5 rounded-lg hover:bg-[#7a0026]">
                <Plus className="h-3 w-3" /> Ajouter
              </button>
            }
          >
            {addOpen && (
              <div className="mb-3 p-3 rounded-xl border border-dashed border-slate-300 space-y-2">
                <input value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  placeholder="Libellé (Domicile, Bureau…)" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A50034]" />
                <input value={newAddr.line} onChange={(e) => setNewAddr({ ...newAddr, line: e.target.value })}
                  placeholder="Adresse complète" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A50034]" />
                <input value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  placeholder="Ville" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A50034]" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddOpen(false)} className="text-xs px-3 py-1.5 rounded-lg hover:bg-slate-100">Annuler</button>
                  <button onClick={addAddr} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg">Enregistrer</button>
                </div>
              </div>
            )}
            {addresses.length === 0 && !addOpen ? (
              <Empty label="Aucune adresse enregistrée." />
            ) : (
              <ul className="space-y-2">
                {addresses.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                    <span className="h-10 w-10 rounded-xl bg-white text-[#A50034] flex items-center justify-center shadow-sm shrink-0">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{a.label}</div>
                      <div className="text-xs text-slate-600 truncate">{a.line}{a.city ? `, ${a.city}` : ""}</div>
                    </div>
                    <button onClick={() => removeAddr(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Gérer votre session</div>
            <div className="text-xs text-slate-500">Déconnectez-vous ou supprimez définitivement votre compte.</div>
          </div>
          <div className="flex gap-2">
            <button onClick={signOut} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold px-5 py-2.5 rounded-xl">
              <Trash2 className="h-4 w-4" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Supprimer mon compte ?</h3>
                <p className="text-xs text-slate-500">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-5">Toutes vos données personnelles, adresses et historique seront définitivement supprimés.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="text-sm px-4 py-2 rounded-xl hover:bg-slate-100">Annuler</button>
              <button onClick={deleteAccount} className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold">Oui, supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, title, subtitle, action, children }: {
  icon: typeof UserIcon; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#fde8ee] to-[#fad0db] text-[#A50034] flex items-center justify-center shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
      <span className="h-10 w-10 rounded-xl bg-white text-[#A50034] flex items-center justify-center shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}

function EditableRow({
  icon: Icon, label, value, editing, onEdit, onCancel, onChange, onSave, placeholder,
}: {
  icon: typeof UserIcon; label: string; value: string; editing: boolean;
  onEdit: () => void; onCancel: () => void; onChange: (v: string) => void; onSave: () => void; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
      <span className="h-10 w-10 rounded-xl bg-white text-[#A50034] flex items-center justify-center shadow-sm shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        {editing ? (
          <input
            autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#A50034]"
          />
        ) : (
          <div className="font-semibold truncate">{value || "—"}</div>
        )}
      </div>
      {editing ? (
        <div className="flex gap-1">
          <button onClick={onSave} className="p-1.5 rounded-lg bg-[#A50034] text-white hover:bg-[#7a0026]"><Save className="h-3.5 w-3.5" /></button>
          <button onClick={onCancel} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-[#A50034]"><Edit3 className="h-3.5 w-3.5" /></button>
      )}
    </div>
  );
}

function Empty({ label, cta }: { label: string; cta?: React.ReactNode }) {
  return (
    <div className="text-center py-10">
      <div className="text-sm text-slate-500">{label}</div>
      {cta && <div className="mt-2 text-sm">{cta}</div>}
    </div>
  );
}
