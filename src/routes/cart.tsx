import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cartQuery, formatPrice } from "@/lib/queries";
import { productImage } from "@/lib/images";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Panier — LG-morchid" }] }),
  component: CartPage,
});

function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({ ...cartQuery, enabled: !!user });

  async function updateQty(id: string, qty: number) {
    if (qty < 1) return remove(id);
    const { error } = await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["cart"] });
  }
  async function remove(id: string) {
    const { error } = await supabase.from("cart_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["cart"] });
  }

  if (authLoading) return <div className="p-12 text-center text-muted-foreground">…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Votre panier</h1>
        <p className="text-muted-foreground mb-6">Connectez-vous pour voir et gérer votre panier.</p>
        <Link to="/auth" className="inline-block bg-brand text-brand-foreground px-6 py-3 rounded font-semibold">
          Se connecter
        </Link>
      </div>
    );
  }

  const rows = items ?? [];
  const total = rows.reduce((s, r) => s + Number(r.product.price) * r.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Mon panier</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-6">Votre panier est vide.</p>
          <Link to="/" className="bg-brand text-brand-foreground px-6 py-3 rounded font-semibold">
            Continuer mes achats
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {rows.map((r) => (
              <div key={r.id} className="flex gap-4 bg-card border border-border rounded p-4">
                <div className="w-24 h-24 bg-surface rounded shrink-0 flex items-center justify-center">
                  <img src={productImage(r.product.slug)} alt={r.product.name} className="max-h-full object-contain p-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{r.product.name}</h3>
                  <p className="text-sm text-muted-foreground">{formatPrice(Number(r.product.price))}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex items-center border border-border rounded">
                      <button onClick={() => updateQty(r.id, r.quantity - 1)} className="p-2 hover:bg-surface"><Minus className="h-3 w-3" /></button>
                      <span className="px-3 text-sm font-medium">{r.quantity}</span>
                      <button onClick={() => updateQty(r.id, r.quantity + 1)} className="p-2 hover:bg-surface"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-brand p-2"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="font-semibold">{formatPrice(Number(r.product.price) * r.quantity)}</div>
              </div>
            ))}
          </div>
          <aside className="bg-surface rounded p-6 h-fit">
            <h2 className="font-semibold mb-4">Récapitulatif</h2>
            <div className="flex justify-between text-sm mb-2">
              <span>Sous-total</span><span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4 text-muted-foreground">
              <span>Livraison</span><span>Gratuite</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between font-bold">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
            <button
              onClick={() => toast.info("Commande de démonstration — paiement à venir")}
              className="mt-6 w-full bg-brand text-brand-foreground py-3 rounded font-semibold hover:bg-brand/90"
            >Passer la commande</button>
          </aside>
        </div>
      )}
    </div>
  );
}
