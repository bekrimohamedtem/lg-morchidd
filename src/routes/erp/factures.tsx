import { createFileRoute } from "@tanstack/react-router";
import { useErp, fmtDA } from "@/lib/erp/store";
import { DataTable } from "@/components/erp/DataTable";
import { generateInvoicePdf, exportOrderCsv } from "@/lib/erp/pdf";
import { FileDown, Printer } from "lucide-react";

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
          { key: "canal", header: "Canal", render: (o) => (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${o.channel === "site" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
              {o.channel === "site" ? "Site web" : "Showroom"}
            </span>
          ) },
          { key: "date", header: "Date", render: (o) => new Date(o.createdAt).toLocaleDateString("fr-DZ") },
          { key: "total", header: "Total", render: (o) => fmtDA(o.total) },
          {
            key: "act", header: "Actions", render: (o) => (
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => generateInvoicePdf(o, "Facture", "save")} className="flex items-center gap-1 text-xs bg-[#A50034] text-white px-2.5 py-1.5 rounded-md font-semibold">
                  <FileDown className="h-3 w-3" /> Facture
                </button>
                <button onClick={() => generateInvoicePdf(o, "Proforma", "save")} className="flex items-center gap-1 text-xs bg-slate-800 text-white px-2.5 py-1.5 rounded-md font-semibold">
                  <FileDown className="h-3 w-3" /> Proforma
                </button>
                <button onClick={() => generateInvoicePdf(o, "Facture", "print")} title="Imprimer" className="flex items-center gap-1 text-xs bg-emerald-600 text-white px-2.5 py-1.5 rounded-md font-semibold">
                  <Printer className="h-3 w-3" /> Imprimer
                </button>
                <button onClick={() => exportOrderCsv(o)} title="Exporter CSV" className="flex items-center gap-1 text-xs bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-md font-semibold">
                  <FileDown className="h-3 w-3" /> CSV
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
