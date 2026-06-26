import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { productBySlugQuery, relatedProductsQuery, formatPrice } from "@/lib/queries";
import { productImage } from "@/lib/images";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Check, ShoppingBag, Minus, Plus, Truck, ShieldCheck, RotateCcw, Zap } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { AskProductAI } from "@/components/AskProductAI";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — LG-morchid` },
      { property: "og:type", content: "product" },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(productBySlugQuery(params.slug));
  },
  component: ProductPage,
  notFoundComponent: () => <div className="p-12 text-center">Produit introuvable</div>,
  errorComponent: ({ error }) => (
    <div className="p-12 text-center text-muted-foreground">{error.message}</div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productBySlugQuery(slug));
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);

  const inStock = p.stock > 0;
  const discount =
    p.original_price && Number(p.original_price) > Number(p.price)
      ? Math.round(((Number(p.original_price) - Number(p.price)) / Number(p.original_price)) * 100)
      : 0;

  async function addToCart(redirect = false) {
    if (!user) {
      toast.info("Connectez-vous pour ajouter au panier");
      navigate({ to: "/auth" });
      return;
    }
    setLoading(true);
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("product_id", p.id)
      .maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + qty })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: p.id, quantity: qty }));
    }
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["cart"] });
    if (redirect) {
      navigate({ to: "/cart" });
    } else {
      toast.success(`${qty} × ${p.name} ajouté au panier`);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-6 flex gap-2">
        <Link to="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-surface rounded-md aspect-square flex items-center justify-center p-12 relative">
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-brand text-brand-foreground text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
          <img src={productImage(p.slug)} alt={p.name} className="max-h-full max-w-full object-contain" />
        </div>

        {/* Infos */}
        <div className="flex flex-col">
          {p.badge && (
            <span className="self-start bg-brand text-brand-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm mb-4">
              {p.badge}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-bold">{p.name}</h1>
          {p.tagline && <p className="text-lg text-muted-foreground mt-2">{p.tagline}</p>}

          <div className="flex items-baseline gap-3 mt-6">
            <span className="text-3xl font-bold">{formatPrice(Number(p.price))}</span>
            {p.original_price && Number(p.original_price) > Number(p.price) && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(Number(p.original_price))}
              </span>
            )}
            {discount > 0 && (
              <span className="text-sm font-semibold text-brand">Économisez {discount}%</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className={`inline-block h-2 w-2 rounded-full ${inStock ? "bg-green-500" : "bg-red-500"}`} />
            <span className={inStock ? "text-green-700 dark:text-green-400" : "text-red-600"}>
              {inStock ? `En stock (${p.stock} dispo.)` : "Rupture de stock"}
            </span>
          </div>

          {p.description && (
            <p className="mt-6 text-foreground/80 leading-relaxed">{p.description}</p>
          )}

          {p.features?.length > 0 && (
            <ul className="mt-6 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 mt-0.5 text-brand shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          <AskProductAI productId={p.id} productName={p.name} />

          {/* Quantité */}
          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-medium">Quantité</span>
            <div className="inline-flex items-center border border-border rounded">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-surface"
                aria-label="Diminuer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(p.stock, q + 1))}
                className="p-2 hover:bg-surface"
                aria-label="Augmenter"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Boutons */}
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => addToCart(false)}
              disabled={loading || !inStock}
              className="border border-brand text-brand px-6 py-4 rounded font-semibold inline-flex items-center justify-center gap-2 hover:bg-brand/10 transition disabled:opacity-60"
            >
              <ShoppingBag className="h-5 w-5" />
              Ajouter au panier
            </button>
            <button
              onClick={() => addToCart(true)}
              disabled={loading || !inStock}
              className="bg-brand text-brand-foreground px-6 py-4 rounded font-semibold inline-flex items-center justify-center gap-2 hover:bg-brand/90 transition disabled:opacity-60"
            >
              <Zap className="h-5 w-5" />
              Acheter maintenant
            </button>
          </div>

          {/* Garanties */}
          <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-border text-xs">
            <div className="flex flex-col items-center text-center gap-1">
              <Truck className="h-5 w-5 text-brand" />
              <span>Livraison gratuite</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <span>Garantie 2 ans</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <RotateCcw className="h-5 w-5 text-brand" />
              <span>Retour 30 jours</span>
            </div>
          </div>
        </div>
      </div>

      <RelatedProducts categoryId={p.category_id} excludeId={p.id} />
    </div>
  );
}

function RelatedProducts({ categoryId, excludeId }: { categoryId: string; excludeId: string }) {
  const { data } = useQuery(relatedProductsQuery(categoryId, excludeId));
  if (!data || data.length === 0) return null;
  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl md:text-3xl font-bold mb-8">Vous pourriez aussi aimer</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {data.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
