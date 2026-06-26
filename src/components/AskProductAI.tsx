import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askAboutProduct } from "@/lib/ai.functions";
import { toast } from "sonner";

export function AskProductAI({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askAboutProduct);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await ask({ data: { productId, question: question.trim() } });
      setAnswer(res.answer);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
      >
        <Sparkles className="h-4 w-4" />
        Demander à l'IA à propos de ce produit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 p-1 hover:bg-surface rounded" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand" /> Assistant IA
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Posez une question sur « {productName} »</p>
            <form onSubmit={submit} className="mt-4 flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: consomme-t-il beaucoup d'énergie ?"
                className="flex-1 border border-border rounded px-3 py-2 text-sm bg-background"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="bg-brand text-brand-foreground px-4 py-2 rounded text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer"}
              </button>
            </form>
            {answer && (
              <div className="mt-4 p-4 bg-surface rounded text-sm whitespace-pre-wrap leading-relaxed">{answer}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
