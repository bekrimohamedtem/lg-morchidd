import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { featuredProductsQuery, categoriesQuery } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { heroTvUrl, heroKitchenUrl } from "@/lib/images";
import { AISearch } from "@/components/AISearch";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LG-morchid — Innovation pour la maison" },
      { name: "description", content: "Téléviseurs OLED, barres de son et électroménager haut de gamme. Livraison rapide partout au Maroc." },
      { property: "og:title", content: "LG-morchid — Innovation pour la maison" },
      { property: "og:description", content: "TV, audio et électroménager. Découvrez le catalogue LG-morchid." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredProductsQuery);
    context.queryClient.ensureQueryData(categoriesQuery);
  },
  component: Home,
  errorComponent: ({ error }) => (
    <div className="p-12 text-center text-muted-foreground">Chargement impossible : {error.message}</div>
  ),
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredProductsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-black text-white">
        <img
          src={heroTvUrl}
          alt="Salon avec téléviseur OLED LG-morchid"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 h-full flex flex-col justify-center max-w-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">Nouvelle gamme OLED evo</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            La lumière<br />parfaite,<br />pixel par pixel.
          </h1>
          <p className="mt-4 text-white/80 text-lg max-w-md">
            Découvrez les téléviseurs auto-éclairés conçus pour le cinéma chez vous.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/category/$slug"
              params={{ slug: "tv-audio" }}
              className="bg-white text-black px-6 py-3 text-sm font-semibold rounded hover:bg-white/90 transition"
            >
              Découvrir les TV
            </Link>
            <Link
              to="/category/$slug"
              params={{ slug: "electromenager" }}
              className="border border-white/40 text-white px-6 py-3 text-sm font-semibold rounded hover:bg-white/10 transition"
            >
              Électroménager
            </Link>
          </div>
        </div>
      </section>

      <AISearch />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-bold">Explorez par catégorie</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group relative aspect-[16/9] overflow-hidden rounded-md bg-surface"
            >
              <img
                src={c.slug === "tv-audio" ? heroTvUrl : heroKitchenUrl}
                alt={c.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-bold">{c.name}</h3>
                <p className="text-sm text-white/80 mt-1">{c.description}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium">
                  Voir <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-bold">Produits vedettes</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </>
  );
}
