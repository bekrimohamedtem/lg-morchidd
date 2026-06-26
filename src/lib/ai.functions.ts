import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const AskInput = z.object({
  productId: z.string().min(1),
  question: z.string().min(1).max(500),
});

const RecommendInput = z.object({
  query: z.string().min(1).max(500),
});

const ScanInput = z.object({ imageDataUrl: z.string().min(10) });
const FinanceInput = z.object({ question: z.string().min(1).max(500), kpis: z.string().min(1).max(8000) });

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)("google/gemini-3-flash-preview");
}

export const askAboutProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AskInput.parse(d))
  .handler(async ({ data }) => {
    const sb = getSupabase();
    const { data: p, error } = await sb
      .from("products")
      .select("name, tagline, description, price, features, stock")
      .eq("id", data.productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) throw new Error("Produit introuvable");

    const { text } = await generateText({
      model: getModel(),
      system:
        "Tu es un conseiller LG-morchid. Réponds en français, de façon concise (max 5 phrases), précise et utile. Si l'info n'est pas dans la fiche, dis-le honnêtement.",
      prompt: `Fiche produit:\nNom: ${p.name}\nAccroche: ${p.tagline ?? ""}\nDescription: ${p.description ?? ""}\nPrix: ${p.price} DA\nStock: ${p.stock}\nCaractéristiques: ${(p.features ?? []).join(" | ")}\n\nQuestion du client: ${data.question}`,
    });
    return { answer: text };
  });

export const recommendProducts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RecommendInput.parse(d))
  .handler(async ({ data }) => {
    const sb = getSupabase();
    const { data: products, error } = await sb
      .from("products")
      .select("id, slug, name, tagline, description, price, features, category_id");
    if (error) throw new Error(error.message);
    if (!products || products.length === 0) return { ids: [], reasoning: "Aucun produit disponible." };

    const list = products
      .map(
        (p, i) =>
          `${i + 1}. id=${p.id} | ${p.name} | ${p.tagline ?? ""} | ${p.price} DA | ${(p.features ?? []).join(", ")} | ${p.description ?? ""}`,
      )
      .join("\n");

    const { text } = await generateText({
      model: getModel(),
      system:
        'Tu es un assistant shopping LG-morchid. À partir d\'une demande client (dimensions, usage, budget...), choisis jusqu\'à 4 produits adaptés dans la liste fournie. Réponds STRICTEMENT en JSON valide: {"ids":["uuid",...],"reasoning":"courte explication en français"}. Ne renvoie rien d\'autre.',
      prompt: `Demande client: ${data.query}\n\nProduits disponibles:\n${list}`,
    });

    let parsed: { ids: string[]; reasoning: string } = { ids: [], reasoning: text };
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch {
      // keep fallback
    }
    const valid = new Set(products.map((p) => p.id));
    parsed.ids = (parsed.ids ?? []).filter((id) => valid.has(id)).slice(0, 4);
    return parsed;
  });

export const scanLabel = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: getModel(),
      system:
        'Tu analyses la photo d\'une étiquette ou d\'un code-barres d\'un appareil électroménager LG (TV, Climatiseur, Lave-linge, Réfrigérateur, Audio). Réponds STRICTEMENT en JSON valide avec ces clés: {"ref":"...","name":"...","category":"TV|Climatiseur|Lave-linge|Réfrigérateur|Audio","dimensions":"LxlxH cm","depot":"Alger Centre|Oran|Constantine"}. Devine le dépôt si non spécifié.',
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identifie ce produit." },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
    });
    const m = text.match(/\{[\s\S]*\}/);
    const fallback = { ref: "AUTO-" + Math.random().toString(36).slice(2, 6).toUpperCase(), name: "Produit inconnu", category: "TV", dimensions: "—", depot: "Alger Centre" };
    try {
      return m ? { ...fallback, ...JSON.parse(m[0]) } : fallback;
    } catch {
      return fallback;
    }
  });

export const analyzeFinance = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FinanceInput.parse(d))
  .handler(async ({ data }) => {
    const { text } = await generateText({
      model: getModel(),
      system:
        "Tu es un analyste financier pour LG-morchid. Réponds en français, de façon concise (max 6 phrases), avec des chiffres clés et des recommandations concrètes. Les montants sont en DA.",
      prompt: `KPIs JSON: ${data.kpis}\n\nQuestion: ${data.question}`,
    });
    return { answer: text };
  });
