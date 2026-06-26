import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { recommendProducts } from "@/lib/ai.functions";
import { productsByIdsQuery, type Product } from "@/lib/queries";
import { ProductCard } from "./ProductCard";
import { toast } from "sonner";

export function AISearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [reasoning, setReasoning] = useState("");
  const recommend = useServerFn(recommendProducts);
  const qc = useQueryClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setReasoning("");
    try {
      const res = await recommend({ data: { query: query.trim() } });
      setReasoning(res.reasoning);
      if (res.ids.length > 0) {
        const prods = await qc.fetchQuery(productsByIdsQuery(res.ids));
        const ordered = res.ids.map((id) => prods.find((p) => p.id === id)).filter(Boolean) as Product[];
        setResults(ordered);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="bg-gradient-to-r from-brand/10 via-brand/5 to-transparent border border-brand/20 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-brand" /> Trouvez le produit parfait avec l'IA
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Décrivez vos critères (dimensions, budget, usage…) et notre IA vous propose les meilleurs choix.
            </p>
          </div>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="bg-brand text-brand-foreground px-5 py-3 rounded font-semibold inline-flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Lancer la recherche IA
            </button>
          )}
        </div>

        {open && (
          <>
            <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: un frigo de maximum 180cm de hauteur avec congélateur"
                className="flex-1 border border-border rounded px-4 py-3 text-sm bg-background"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-brand text-brand-foreground px-5 py-3 rounded font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Recherche…" : "Trouver"}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setResults([]); setReasoning(""); setQuery(""); }}
                className="px-3 py-3 rounded text-sm text-muted-foreground hover:bg-surface inline-flex items-center gap-1"
              >
                <X className="h-4 w-4" />
              </button>
            </form>

            {reasoning && (
              <div className="mt-4 p-4 bg-card border border-border rounded text-sm leading-relaxed">
                <span className="font-semibold text-brand">IA : </span>{reasoning}
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
