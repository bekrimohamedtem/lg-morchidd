import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Mon compte — LG-morchid" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (loading || !user) return <div className="p-12 text-center text-muted-foreground">…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Mon compte</h1>
      <p className="text-muted-foreground mb-8">{user.email}</p>

      <div className="bg-card border border-border rounded p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Nom complet</label>
          <div className="flex gap-2 mt-1">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex-1 border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              onClick={async () => {
                const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName });
                if (error) toast.error(error.message);
                else toast.success("Profil mis à jour");
              }}
              className="bg-brand text-brand-foreground px-4 rounded text-sm font-semibold"
            >Enregistrer</button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link to="/cart" className="bg-surface px-4 py-2 rounded text-sm hover:bg-border">Voir mon panier</Link>
        <button onClick={signOut} className="ml-auto text-sm text-muted-foreground hover:text-brand">Se déconnecter</button>
      </div>
    </div>
  );
}
