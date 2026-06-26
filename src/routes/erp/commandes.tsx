import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useErp, fmtDA } from "@/lib/erp/store";
import { DataTable, StatusBadge } from "@/components/erp/DataTable";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePdf } from "@/lib/erp/pdf";

export const Route = createFileRoute("/erp/commandes")({ component: OrdersPage });

function OrdersPage() {
  const { orders, role, employees, setOrderStatus, clients, stock, addOrder } = useErp();
  const canCreate = role === "vendeur" || role === "admin";
  const [open, setOpen] = useState(false);

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
        columns={[
          { key: "ref", header: "Réf.", render: (o) => <span className="font-mono text-xs">{o.ref}</span>, searchValue: (o) => o.ref },
          { key: "client", header: "Client", render: (o) => `${o.client.firstName} ${o.client.lastName}`, searchValue: (o) => `${o.client.firstName} ${o.client.lastName}` },
          { key: "commercial", header: "Commercial", render: (o) => employees.find((e) => e.id === o.commercialId)?.fullName ?? "—" },
          { key: "total", header: "Total", render: (o) => <span className="font-semibold">{fmtDA(o.total)}</span> },
          {
            key: "status", header: "Statut", render: (o) => (
              role === "depot" || role === "admin" ? (
                <select
                  value={o.status}
                  onChange={(e) => setOrderStatus(o.id, e.target.value as never)}
                  className="text-xs border rounded-md px-2 py-1"
                >
                  <option>En attente</option>
                  <option>En cours de livraison</option>
                  <option>Livré</option>
                </select>
              ) : (
                <StatusBadge status={o.status} />
              )
            ),
          },
          {
            key: "act", header: "Actions", render: (o) =>
              (role === "vendeur" || role === "admin") && (
                <button
                  onClick={() => generateInvoicePdf(o, "Facture")}
                  className="text-xs bg-[#A50034] text-white px-3 py-1.5 rounded-md font-semibold"
                >
                  PDF
                </button>
              ),
          },
        ]}
      />

      {open && (
        <NewOrderModal
          onClose={() => setOpen(false)}
          onCreate={(clientId, items, commercialId) => {
            const o = addOrder(clientId, items, commercialId);
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
  onCreate: (clientId: string, items: { productId: string; quantity: number }[], commercialId: string) => void;
  clients: ReturnType<typeof useErp.getState>["clients"];
  stock: ReturnType<typeof useErp.getState>["stock"];
  employees: ReturnType<typeof useErp.getState>["employees"];
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [commercialId, setCommercialId] = useState(employees.find((e) => e.role === "commercial")?.id ?? "");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: stock[0]?.id ?? "", quantity: 1 }]);
  const commercials = employees.filter((e) => e.role === "commercial");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Nouvelle commande</h2>
        <div className="space-y-4">
          <Field label="Client">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input">
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.phone}</option>)}
            </select>
          </Field>
          <Field label="Commercial">
            <select value={commercialId} onChange={(e) => setCommercialId(e.target.value)} className="input">
              {commercials.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </Field>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Articles</label>
              <button onClick={() => setItems((s) => [...s, { productId: stock[0]?.id ?? "", quantity: 1 }])} className="text-xs text-[#A50034] font-semibold">+ ajouter</button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={it.productId}
                    onChange={(e) => setItems((s) => s.map((x, j) => j === i ? { ...x, productId: e.target.value } : x))}
                    className="input flex-1"
                  >
                    {stock.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmtDA(p.priceSale)}</option>)}
                  </select>
                  <input
                    type="number" min={1} value={it.quantity}
                    onChange={(e) => setItems((s) => s.map((x, j) => j === i ? { ...x, quantity: Math.max(1, +e.target.value) } : x))}
                    className="input w-20"
                  />
                  <button onClick={() => setItems((s) => s.filter((_, j) => j !== i))} className="p-2 hover:bg-red-50 rounded-lg text-[#A50034]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
          <button
            onClick={() => onCreate(clientId, items, commercialId)}
            className="px-4 py-2 rounded-lg bg-[#A50034] text-white text-sm font-semibold"
          >
            Créer
          </button>
        </div>
        <style>{`.input { width:100%; padding:0.5rem 0.75rem; border:1px solid #e2e8f0; border-radius:0.5rem; font-size:0.875rem; background:white; outline:none; } .input:focus { border-color:#A50034; }`}</style>
      </div>
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
