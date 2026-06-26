import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useErp } from "@/lib/erp/store";
import { DataTable, StatusBadge } from "@/components/erp/DataTable";
import type { Client } from "@/lib/erp/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/erp/clients")({ component: ClientsPage });

const empty: Client = { id: "", firstName: "", lastName: "", phone: "", address: "", type: "standard" };

function ClientsPage() {
  const { clients, upsertClient, deleteClient } = useErp();
  const [edit, setEdit] = useState<Client | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clients</h1>
      <DataTable
        title="Liste des clients"
        rows={clients}
        actions={
          <button onClick={() => setEdit({ ...empty, id: "c-" + Math.random().toString(36).slice(2, 8) })} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#A50034]">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        }
        columns={[
          { key: "name", header: "Nom complet", render: (c) => `${c.firstName} ${c.lastName}`, searchValue: (c) => `${c.firstName} ${c.lastName}` },
          { key: "phone", header: "Téléphone", render: (c) => c.phone, searchValue: (c) => c.phone },
          { key: "adr", header: "Adresse", render: (c) => c.address, searchValue: (c) => c.address },
          { key: "type", header: "Type", render: (c) => <StatusBadge status={c.type} /> },
          {
            key: "act", header: "Actions", render: (c) => (
              <div className="flex gap-1">
                <button onClick={() => setEdit(c)} className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => deleteClient(c.id)} className="p-1.5 bg-red-100 text-[#A50034] rounded-md"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
      />
      {edit && (
        <ClientModal
          client={edit}
          onSave={(c) => { upsertClient(c); setEdit(null); }}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}

function ClientModal({ client, onSave, onClose }: { client: Client; onSave: (c: Client) => void; onClose: () => void }) {
  const [c, setC] = useState(client);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-3">
        <h2 className="text-xl font-bold">{client.firstName ? "Modifier" : "Nouveau"} client</h2>
        <Input label="Prénom" value={c.firstName} onChange={(v) => setC({ ...c, firstName: v })} />
        <Input label="Nom" value={c.lastName} onChange={(v) => setC({ ...c, lastName: v })} />
        <Input label="Téléphone" value={c.phone} onChange={(v) => setC({ ...c, phone: v })} />
        <Input label="Adresse" value={c.address} onChange={(v) => setC({ ...c, address: v })} />
        <div>
          <label className="text-sm font-medium block mb-1">Type</label>
          <select value={c.type} onChange={(e) => setC({ ...c, type: e.target.value as never })} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="standard">Standard</option>
            <option value="convention">Sous convention</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Annuler</button>
          <button onClick={() => onSave(c)} className="px-4 py-2 rounded-lg bg-[#A50034] text-white text-sm font-semibold">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}
