import { createFileRoute } from "@tanstack/react-router";
import { useErp, fmtDA } from "@/lib/erp/store";
import { DataTable } from "@/components/erp/DataTable";

export const Route = createFileRoute("/erp/stock")({ component: StockPage });

function StockPage() {
  const stock = useErp((s) => s.stock);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">État du stock</h1>
      <DataTable
        title="Liste des articles"
        rows={stock}
        columns={[
          { key: "ref", header: "Réf.", render: (r) => <span className="font-mono text-xs">{r.ref}</span>, searchValue: (r) => r.ref },
          { key: "name", header: "Article", render: (r) => <span className="font-medium">{r.name}</span>, searchValue: (r) => r.name },
          { key: "cat", header: "Catégorie", render: (r) => r.category, searchValue: (r) => r.category },
          { key: "depot", header: "Dépôt", render: (r) => r.depot, searchValue: (r) => r.depot },
          { key: "price", header: "Prix", render: (r) => <span className="font-semibold">{fmtDA(r.priceSale)}</span> },
          {
            key: "stock", header: "Stock", render: (r) => (
              <span className={`font-bold ${r.stock === 0 ? "text-[#A50034]" : r.stock <= 2 ? "text-amber-600" : "text-green-600"}`}>
                {r.stock}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
