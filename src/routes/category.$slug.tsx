import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsByCategoryQuery } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug === "tv-audio" ? "TV & Audio" : "Électroménager"} — LG-morchid` },
      { name: "description", content: "Catalogue LG-morchid : produits haut de gamme pour la maison." },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(productsByCategoryQuery(params.slug));
  },
  component: CategoryPage,
  notFoundComponent: () => <div className="p-12 text-center">Catégorie introuvable</div>,
  errorComponent: ({ error }) => (
    <div className="p-12 text-center text-muted-foreground">{error.message}</div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productsByCategoryQuery(slug));
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-4xl md:text-5xl font-bold">{data.category.name}</h1>
        {data.category.description && (
          <p className="mt-3 text-muted-foreground max-w-2xl">{data.category.description}</p>
        )}
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
