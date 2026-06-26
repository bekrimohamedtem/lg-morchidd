import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, User, Search } from "lucide-react";
import { cartQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user } = useAuth();
  const { data: cart } = useQuery({ ...cartQuery, enabled: !!user });
  const count = (cart ?? []).reduce((s, r) => s + r.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-1">
          <span className="text-2xl font-bold tracking-tight text-brand">LG</span>
          <span className="text-2xl font-light tracking-tight">-morchid</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/category/$slug"
            params={{ slug: "tv-audio" }}
            className="hover:text-brand transition-colors"
            activeProps={{ className: "text-brand" }}
          >
            TV &amp; Audio
          </Link>
          <Link
            to="/category/$slug"
            params={{ slug: "electromenager" }}
            className="hover:text-brand transition-colors"
            activeProps={{ className: "text-brand" }}
          >
            Électroménager
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-surface rounded-full" aria-label="Rechercher">
            <Search className="h-5 w-5" />
          </button>
          <Link
            to={user ? "/account" : "/auth"}
            className="p-2 hover:bg-surface rounded-full"
            aria-label="Compte"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="relative p-2 hover:bg-surface rounded-full" aria-label="Panier">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand text-brand-foreground text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
