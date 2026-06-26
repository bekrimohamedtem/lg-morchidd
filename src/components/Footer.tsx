export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xl font-bold text-brand">LG</span>
            <span className="text-xl font-light">-morchid</span>
          </div>
          <p className="text-muted-foreground">L'innovation domestique, livrée chez vous.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Catégories</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>TV &amp; Audio</li>
            <li>Électroménager</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>Contact</li>
            <li>Livraison</li>
            <li>Garantie</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">À propos</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>Notre histoire</li>
            <li>Magasins</li>
            <li>Carrières</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LG-morchid. Tous droits réservés.
      </div>
    </footer>
  );
}
