import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useErp, fmtDA } from "@/lib/erp/store";
import { DataTable, StatusBadge } from "@/components/erp/DataTable";
import { Plus, Trash2, MapPin, Printer, FileDown, Search } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePdf, exportOrderCsv } from "@/lib/erp/pdf";

export const Route = createFileRoute("/erp/commandes")({ component: OrdersPage });

function OrdersPage() {
  const { orders, role, employees, setOrderStatus, clients, stock, addOrder } = useErp();
  const canCreate = role === "vendeur" || role === "admin";
  const isComptable = role === "comptable";
  const [open, setOpen] = useState(false);

  const baseCols = [
    { key: "ref", header: "Réf.", render: (o: typeof orders[number]) => <span className="font-mono text-xs">{o.ref}</span>, searchValue: (o: typeof orders[number]) => o.ref },
    { key: "client", header: "Client", render: (o: typeof orders[number]) => (
      <div>
        <div className="font-medium">{o.client.firstName} {o.client.lastName}</div>
        <div className="text-[11px] text-slate-500">{o.client.phone}</div>
      </div>
    ), searchValue: (o: typeof orders[number]) => `${o.client.firstName} ${o.client.lastName}` },
    { key: "loc", header: "Localisation", render: (o: typeof orders[number]) => (
      <div className="flex items-start gap-1 max-w-[220px]">
        <MapPin className="h-3.5 w-3.5 text-[#A50034] mt-0.5 shrink-0" />
        <span className="text-xs text-slate-700">{o.client.address}</span>
      </div>
    ), searchValue: (o: typeof orders[number]) => o.client.address },
    { key: "commercial", header: "Commercial", render: (o: typeof orders[number]) => employees.find((e) => e.id === o.commercialId)?.fullName ?? "—" },
  ];

  const comptableCols = isComptable ? [
    { key: "channel", header: "Canal", render: (o: typeof orders[number]) => (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${o.channel === "site" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
        {o.channel === "site" ? "Site web" : "Showroom"}
      </span>
    ) },
    { key: "ctype", header: "Type client", render: (o: typeof orders[number]) => <StatusBadge status={o.client.type} /> },
    { key: "initial", header: "Prix initial", render: (o: typeof orders[number]) => <span className="text-slate-500">{fmtDA(o.totalInitial)}</span> },
    { key: "benef", header: "Bénéfice", render: (o: typeof orders[number]) => <span className="text-green-700 font-semibold">{fmtDA(o.total - o.totalInitial)}</span> },
  ] : [];

  const tailCols = [
    { key: "total", header: "Total", render: (o: typeof orders[number]) => <span className="font-semibold">{fmtDA(o.total)}</span> },
    {
      key: "status", header: "Statut", render: (o: typeof orders[number]) => (
        role === "admin" ? (
          <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value as never)} className="text-xs border rounded-md px-2 py-1">
            <option>En attente</option><option>En cours de livraison</option><option>Livré</option><option>Retourné</option>
          </select>
        ) : <StatusBadge status={o.status} />
      ),
    },
    {
      key: "act", header: "Actions", render: (o: typeof orders[number]) =>
        (role === "vendeur" || role === "comptable" || role === "admin") && (
          <div className="flex gap-1">
            <button onClick={() => generateInvoicePdf(o, "Facture", "save")} className="text-xs bg-[#A50034] text-white px-2 py-1 rounded-md font-semibold">PDF</button>
            <button onClick={() => generateInvoicePdf(o, "Facture", "print")} className="text-xs bg-slate-800 text-white px-2 py-1 rounded-md font-semibold flex items-center gap-1"><Printer className="h-3 w-3" /></button>
            <button onClick={() => exportOrderCsv(o)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-semibold flex items-center gap-1"><FileDown className="h-3 w-3" /></button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Commandes</h1>
      </div>
      <DataTable
        title="Liste des commandes"
        rows={orders}
        actions={
          canCreate && (
            <button onClick={() => setOpen(true)} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#A50034]">
              <Plus className="h-4 w-4" /> Nouvelle commande
            </button>
          )
        }
        columns={[...baseCols, ...comptableCols, ...tailCols]}
      />

      {open && (
        <NewOrderModal
          onClose={() => setOpen(false)}
          onCreate={(clientId, items, commercialId, channel) => {
            const o = addOrder(clientId, items, commercialId, channel);
            if (o) {
              toast.success(`Commande ${o.ref} créée`);
              setOpen(false);
            }
          }}
          clients={clients}
          stock={stock}
          employees={employees}
        />
      )}
    </div>
  );
}

function NewOrderModal({
  onClose, onCreate, clients, stock, employees,
}: {
  onClose: () => void;
  onCreate: (clientId: string, items: { productId: string; quantity: number }[], commercialId: string, channel: "site" | "showroom") => void;
  clients: ReturnType<typeof useErp.getState>["clients"];
  stock: ReturnType<typeof useErp.getState>["stock"];
  employees: ReturnType<typeof useErp.getState>["employees"];
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [commercialId, setCommercialId] = useState(employees.find((e) => e.role === "commercial")?.id ?? "");
  const [channel, setChannel] = useState<"site" | "showroom">("showroom");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: stock[0]?.id ?? "", quantity: 1 }]);
  const commercials = employees.filter((e) => e.role === "commercial");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Nouvelle commande</h2>
        <div className="space-y-4">
          <Field label="Client">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input">
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.phone} ({c.type})</option>)}
            </select>
          </Field>
          <Field label="Commercial">
            <select value={commercialId} onChange={(e) => setCommercialId(e.target.value)} className="input">
              {commercials.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </Field>
          <Field label="Canal de vente">
            <div className="flex gap-2">
              {(["showroom", "site"] as const).map((c) => (
                <button key={c} onClick={() => setChannel(c)} type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 ${channel === c ? "bg-[#A50034] text-white border-[#A50034]" : "bg-white text-slate-600 border-slate-200"}`}>
                  {c === "site" ? "Site web" : "Showroom"}
                </button>
              ))}
            </div>
          </Field>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Articles</label>
              <button onClick={() => setItems((s) => [...s, { productId: stock[0]?.id ?? "", quantity: 1 }])} className="text-xs text-[#A50034] font-semibold">+ ajouter</button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <ProductPicker
                  key={i}
                  stock={stock}
                  productId={it.productId}
                  quantity={it.quantity}
                  onChange={(productId, quantity) => setItems((s) => s.map((x, j) => j === i ? { productId, quantity } : x))}
                  onRemove={() => setItems((s) => s.filter((_, j) => j !== i))}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
          <button onClick={() => onCreate(clientId, items, commercialId, channel)} className="px-4 py-2 rounded-lg bg-[#A50034] text-white text-sm font-semibold">Créer</button>
        </div>
        <style>{`.input { width:100%; padding:0.5rem 0.75rem; border:1px solid #e2e8f0; border-radius:0.5rem; font-size:0.875rem; background:white; outline:none; } .input:focus { border-color:#A50034; }`}</style>
      </div>
    </div>
  );
}

function ProductPicker({ stock, productId, quantity, onChange, onRemove }: {
  stock: ReturnType<typeof useErp.getState>["stock"];
  productId: string;
  quantity: number;
  onChange: (productId: string, quantity: number) => void;
  onRemove: () => void;
}) {
  const selected = stock.find((p) => p.id === productId);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    if (!query.trim()) return stock.slice(0, 10);
    const q = query.toLowerCase();
    return stock.filter((p) => p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 10);
  }, [query, stock]);

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Taper le nom du produit…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-[#A50034]"
          />
        </div>
        {open && results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {results.map((p) => (
              <button key={p.id} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(p.id, quantity); setQuery(p.name); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-[11px] text-slate-500">{p.ref} · {p.category} · {fmtDA(p.priceSale)} · stock {p.stock}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <input type="number" min={1} value={quantity} onChange={(e) => onChange(productId, Math.max(1, +e.target.value))} className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
      <button onClick={onRemove} className="p-2 hover:bg-red-50 rounded-lg text-[#A50034]"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}
