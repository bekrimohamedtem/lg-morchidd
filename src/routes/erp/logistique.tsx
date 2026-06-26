import { createFileRoute } from "@tanstack/react-router";
import { useErp, fmtDA } from "@/lib/erp/store";
import { DataTable, StatusBadge } from "@/components/erp/DataTable";

export const Route = createFileRoute("/erp/logistique")({ component: LogiPage });

function LogiPage() {
  const { orders, setOrderStatus } = useErp();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Suivi logistique</h1>
      <DataTable
        title="Livraisons"
        rows={orders}
        columns={[
          { key: "ref", header: "Réf.", render: (o) => <span className="font-mono text-xs">{o.ref}</span>, searchValue: (o) => o.ref },
          { key: "client", header: "Destinataire", render: (o) => `${o.client.firstName} ${o.client.lastName}` },
          { key: "adr", header: "Adresse", render: (o) => o.client.address, searchValue: (o) => o.client.address },
          { key: "total", header: "Total", render: (o) => fmtDA(o.total) },
          {
            key: "status", header: "Statut", render: (o) => (
              <select
                value={o.status}
                onChange={(e) => setOrderStatus(o.id, e.target.value as never)}
                className="text-xs border rounded-md px-2 py-1"
              >
                <option>En attente</option>
                <option>En cours de livraison</option>
                <option>Livré</option>
              </select>
            ),
          },
          { key: "badge", header: "État", render: (o) => <StatusBadge status={o.status} /> },
        ]}
      />
    </div>
  );
}
