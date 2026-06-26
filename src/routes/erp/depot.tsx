import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useErp } from "@/lib/erp/store";
import { DataTable } from "@/components/erp/DataTable";
import { scanLabel } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/erp/depot")({ component: DepotPage });

function DepotPage() {
  const { stock, movements, adjustStock, upsertStock } = useErp();
  const [scanOpen, setScanOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState<{ id: string; type: "entrée" | "sortie" } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion du dépôt</h1>
        <button onClick={() => setScanOpen(true)} className="bg-[#A50034] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <Camera className="h-4 w-4" /> Scanner étiquette (IA)
        </button>
      </div>

      <DataTable
        title="Articles"
        rows={stock}
        columns={[
          { key: "ref", header: "Réf.", render: (r) => <span className="font-mono text-xs">{r.ref}</span>, searchValue: (r) => r.ref },
          { key: "name", header: "Article", render: (r) => r.name, searchValue: (r) => r.name },
          { key: "depot", header: "Dépôt", render: (r) => r.depot },
          { key: "stock", header: "Stock", render: (r) => <span className="font-bold">{r.stock}</span> },
          {
            key: "act", header: "Mouvements", render: (r) => (
              <div className="flex gap-1">
                <button onClick={() => setAdjustOpen({ id: r.id, type: "entrée" })} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" /> Entrée
                </button>
                <button onClick={() => setAdjustOpen({ id: r.id, type: "sortie" })} className="text-xs bg-red-100 text-[#A50034] px-2 py-1 rounded-md flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" /> Sortie
                </button>
              </div>
            ),
          },
        ]}
      />

      <DataTable
        title="Historique des mouvements"
        rows={movements}
        columns={[
          { key: "date", header: "Date", render: (m) => new Date(m.date).toLocaleString("fr-DZ") },
          { key: "art", header: "Article", render: (m) => stock.find((s) => s.id === m.productId)?.name ?? m.productId },
          { key: "type", header: "Type", render: (m) => (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.type === "entrée" ? "bg-green-100 text-green-700" : "bg-red-100 text-[#A50034]"}`}>{m.type}</span>
          ) },
          { key: "qty", header: "Quantité", render: (m) => m.qty },
          { key: "depot", header: "Dépôt", render: (m) => m.depot },
          { key: "note", header: "Note", render: (m) => <span className="text-xs text-slate-500">{m.note ?? "—"}</span> },
        ]}
      />

      {scanOpen && <ScanDialog onClose={() => setScanOpen(false)} onApply={(s) => { upsertStock({ ...s, id: s.id || "p-" + Math.random().toString(36).slice(2, 8) }); toast.success("Article ajouté/mis à jour"); setScanOpen(false); }} />}
      {adjustOpen && (
        <AdjustDialog
          item={stock.find((s) => s.id === adjustOpen.id)!}
          type={adjustOpen.type}
          onClose={() => setAdjustOpen(null)}
          onConfirm={(qty, note) => {
            adjustStock(adjustOpen.id, adjustOpen.type === "entrée" ? qty : -qty, adjustOpen.type, stock.find((s) => s.id === adjustOpen.id)!.depot, note);
            toast.success(`Mouvement enregistré (${adjustOpen.type})`);
            setAdjustOpen(null);
          }}
        />
      )}
    </div>
  );
}

function AdjustDialog({ item, type, onClose, onConfirm }: { item: { name: string }; type: string; onClose: () => void; onConfirm: (qty: number, note: string) => void }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-1">Mouvement de stock — {type}</h2>
        <p className="text-sm text-slate-500 mb-4">{item.name}</p>
        <label className="text-sm font-medium block mb-1">Quantité</label>
        <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        <label className="text-sm font-medium block mb-1 mt-3">Note</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
          <button onClick={() => onConfirm(qty, note)} className="px-4 py-2 rounded-lg bg-[#A50034] text-white text-sm font-semibold">Valider</button>
        </div>
      </div>
    </div>
  );
}

function ScanDialog({ onClose, onApply }: { onClose: () => void; onApply: (s: import("@/lib/erp/types").StockItem) => void }) {
  const fn = useServerFn(scanLabel);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof scanLabel>> | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      const reader = new FileReader();
      const data: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      setPreview(data);
      const r = await fn({ data: { imageDataUrl: data } });
      setResult(r);
      toast.success("Étiquette analysée");
    } catch (e) {
      toast.error("Échec analyse", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-2">Scanner une étiquette / code-barres</h2>
        <p className="text-sm text-slate-500 mb-4">Uploadez la photo. L'IA identifie le modèle, la catégorie, les dimensions et le dépôt.</p>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="block w-full text-sm" />
        {preview && <img src={preview} alt="" className="mt-3 max-h-48 rounded-lg border" />}
        {busy && <div className="flex items-center gap-2 mt-3 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</div>}
        {result && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-1 text-sm">
            <div><b>Modèle :</b> {result.name}</div>
            <div><b>Catégorie :</b> {result.category}</div>
            <div><b>Dimensions :</b> {result.dimensions}</div>
            <div><b>Dépôt suggéré :</b> {result.depot}</div>
            <div><b>Réf. :</b> {result.ref}</div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Fermer</button>
          {result && (
            <button
              onClick={() => onApply({
                id: "", ref: result.ref, name: result.name, category: result.category as never,
                depot: result.depot, dimensions: result.dimensions,
                priceInitial: 0, priceSale: 0, stock: 1,
              })}
              className="px-4 py-2 rounded-lg bg-[#A50034] text-white text-sm font-semibold"
            >
              Ajouter au stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
