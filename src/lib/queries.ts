import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type Product = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  badge: string | null;
  features: string[];
  stock: number;
  is_featured: boolean;
};

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name, description")
      .order("sort_order");
    if (error) throw error;
    return data as Category[];
  },
});

export const featuredProductsQuery = queryOptions({
  queryKey: ["products", "featured"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as Product[];
  },
});

export const productsByCategoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["products", "category", slug],
    queryFn: async (): Promise<{ category: Category; products: Product[] }> => {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("id, slug, name, description")
        .eq("slug", slug)
        .maybeSingle();
      if (catErr) throw catErr;
      if (!cat) throw new Error("Category not found");
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", cat.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { category: cat as Category, products: data as unknown as Product[] };
    },
  });

export const productsByIdsQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ["products", "byIds", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Product[]> => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("products").select("*").in("id", ids);
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

export const relatedProductsQuery = (categoryId: string, excludeId: string) =>
  queryOptions({
    queryKey: ["products", "related", categoryId, excludeId],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", categoryId)
        .neq("id", excludeId)
        .limit(4);
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Product not found");
      return data as unknown as Product;
    },
  });

export type CartRow = {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
};

export const cartQuery = queryOptions({
  queryKey: ["cart"],
  queryFn: async (): Promise<CartRow[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, product_id, quantity, product:products(*)")
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as unknown as CartRow[];
  },
});

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(n);
}
