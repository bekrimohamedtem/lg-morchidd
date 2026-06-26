import { createFileRoute } from "@tanstack/react-router";
import { useErp, fmtDA } from "@/lib/erp/store";
import { DataTable, StatusBadge } from "@/components/erp/DataTable";
import { Lock, MapPin } from "lucide-react";

export const Route = createFileRoute("/erp/logistique")({ component: LogiPage });

function LogiPage() {
  const { orders, setOrderStatus, role } = useErp();
  const isAdmin = role === "admin";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Suivi logistique</h1>
      <p className="text-sm text-slate-500">
        L'agent de dépôt met à jour le statut jusqu'à la livraison. Une fois <b>Livré</b>, seul l'admin peut modifier (retour, annulation).
      </p>
      <DataTable
        title="Livraisons"
        rows={orders}
        columns={[
          { key: "ref", header: "Réf.", render: (o) => <span className="font-mono text-xs">{o.ref}</span>, searchValue: (o) => o.ref },
          { key: "client", header: "Destinataire", render: (o) => `${o.client.firstName} ${o.client.lastName}` },
          { key: "adr", header: "Localisation", render: (o) => (
            <div className="flex items-start gap-1 max-w-[260px]">
              <MapPin className="h-3.5 w-3.5 text-[#A50034] mt-0.5 shrink-0" />
              <span className="text-xs">{o.client.address}</span>
            </div>
          ), searchValue: (o) => o.client.address },
          { key: "total", header: "Total", render: (o) => fmtDA(o.total) },
          {
            key: "status", header: "Statut", render: (o) => {
              const locked = (o.status === "Livré" || o.status === "Retourné") && !isAdmin;
              if (locked) {
                return (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={o.status} />
                    <Lock className="h-3 w-3 text-slate-400" />
                  </div>
                );
              }
              return (
                <select
                  value={o.status}
                  onChange={(e) => setOrderStatus(o.id, e.target.value as never)}
                  className="text-xs border rounded-md px-2 py-1"
                >
                  <option>En attente</option>
                  <option>En cours de livraison</option>
                  <option>Livré</option>
                  {isAdmin && <option>Retourné</option>}
                </select>
              );
            },
          },
          { key: "badge", header: "État", render: (o) => <StatusBadge status={o.status} /> },
        ]}
      />
    </div>
  );
}
