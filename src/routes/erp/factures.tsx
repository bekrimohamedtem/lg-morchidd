import { createFileRoute } from "@tanstack/react-router";
import { useErp, fmtDA } from "@/lib/erp/store";
import { DataTable } from "@/components/erp/DataTable";
import { generateInvoicePdf } from "@/lib/erp/pdf";
import { FileDown } from "lucide-react";

export const Route = createFileRoute("/erp/factures")({ component: FacturesPage });

function FacturesPage() {
  const { orders } = useErp();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Factures & Proformas</h1>
      <DataTable
        title="Documents"
        rows={orders}
        columns={[
          { key: "ref", header: "Commande", render: (o) => <span className="font-mono text-xs">{o.ref}</span>, searchValue: (o) => o.ref },
          { key: "client", header: "Client", render: (o) => `${o.client.firstName} ${o.client.lastName}` },
          { key: "date", header: "Date", render: (o) => new Date(o.createdAt).toLocaleDateString("fr-DZ") },
          { key: "total", header: "Total", render: (o) => fmtDA(o.total) },
          {
            key: "act", header: "Télécharger", render: (o) => (
              <div className="flex gap-2">
                <button onClick={() => generateInvoicePdf(o, "Facture")} className="flex items-center gap-1 text-xs bg-[#A50034] text-white px-3 py-1.5 rounded-md font-semibold">
                  <FileDown className="h-3 w-3" /> Facture
                </button>
                <button onClick={() => generateInvoicePdf(o, "Proforma")} className="flex items-center gap-1 text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md font-semibold">
                  <FileDown className="h-3 w-3" /> Proforma
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
