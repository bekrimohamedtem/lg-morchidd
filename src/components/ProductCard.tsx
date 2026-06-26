import { Link } from "@tanstack/react-router";
import { formatPrice, type Product } from "@/lib/queries";
import { productImage } from "@/lib/images";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col bg-card border border-border rounded-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-square bg-surface overflow-hidden">
        {product.badge && (
          <span className="absolute top-3 left-3 z-10 bg-brand text-brand-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm">
            {product.badge}
          </span>
        )}
        <img
          src={productImage(product.slug)}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 flex flex-col gap-1">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{product.name}</h3>
        {product.tagline && (
          <p className="text-xs text-muted-foreground line-clamp-1">{product.tagline}</p>
        )}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-bold">{formatPrice(Number(product.price))}</span>
          {product.original_price && Number(product.original_price) > Number(product.price) && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(Number(product.original_price))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
