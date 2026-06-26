# ERP & Stock LG-morchid — Plan

Application ERP/stock interne (mock front-end, sans authentification réelle) avec **switcheur de rôles** persistant pour démo RBAC. Couleurs LG : anthracite `#1a1a1a`, blanc `#ffffff`, rouge `#A50034`.

## Architecture

- Garder le site vitrine existant (`/`, `/product/:slug`, `/cart`, ...) = rôle **User**.
- Nouvelle section ERP sous `/erp/*` avec layout sidebar rétractable + topbar (cloche notif, chat admin, profil) reproduisant les screenshots fournis.
- Switcheur de rôles flottant en bas à droite (toujours visible) : `User · Commercial · Agent Dépôt · Vendeur · Comptable · Admin`. Persisté dans `localStorage`. Aucun login.
- Garde RBAC côté route : redirection si rôle insuffisant. Menu sidebar filtré par rôle.

## Stockage (mock front)

Tout en mémoire + `localStorage` (zustand) — pas de migration DB. Données seed : produits LG existants (DA), clients, employés, commandes, dépôts, factures, notifications, messages admin.

## Pages par rôle

| Rôle | Accès |
|---|---|
| User | Vitrine uniquement |
| Commercial | `/erp/commandes` (lecture), `/erp/stock` (lecture + prix) |
| Agent Dépôt | `/erp/depot` (entrées/sorties + scan IA), `/erp/logistique` (statuts livraison) |
| Vendeur | `/erp/clients` (CRUD), `/erp/commandes` (créer), `/erp/factures` (PDF + proforma) |
| Comptable | `/erp/finance` (CA, bénéfices = ΣPrixTotal − ΣPrixInitial, classement commerciaux) + assistant IA texte |
| Admin | Tout + `/erp/employes` (CRUD) + `/erp/messages` (broadcast urgent rouge / normal bleu) |

## Fonctionnalités IA (Lovable AI Gateway, `google/gemini-3-flash-preview`)

1. **Scan étiquette/code-barres** (`scanLabel`) — server fn multimodal (image → modèle, catégorie TV/Clim, dimensions, dépôt suggéré). Réutilise `ai-gateway.server.ts`.
2. **Assistant comptable** (`analyzeFinance`) — server fn texte, reçoit KPIs sérialisés + question.

## Notifications

- Hook `useStockWatcher` : surveille produits avec `stock ≤ 2`, génère toast + entrée dans le centre de notifications (cloche topbar). Visible pour tous sauf User.
- Messages admin : composant centre de messages, badge rouge si `urgency=urgent`, bleu si `normal`.

## Composants partagés

- `ErpLayout` (sidebar collapsible, topbar, footer)
- `RoleSwitcher` (dropdown flottant)
- `DataTable` réutilisable (tri, filtre, pagination) basé sur shadcn
- `KpiCard`, `StatusBadge`, `NotificationBell`, `MessageCenter`, `ProfileCard` amélioré

## PDF Factures

`jspdf` + `jspdf-autotable` (client-side) pour générer facture/proforma téléchargeable.

## Fichiers principaux à créer

- `src/lib/erp/store.ts` (zustand: role, data, notifications, messages)
- `src/lib/erp/seed.ts`
- `src/lib/erp/pdf.ts`
- `src/lib/ai.functions.ts` : ajouter `scanLabel`, `analyzeFinance`
- `src/components/erp/*` : `ErpLayout`, `Sidebar`, `Topbar`, `RoleSwitcher`, `DataTable`, `KpiCard`, `NotificationBell`, `MessageCenter`, `ScanDialog`
- `src/routes/erp/route.tsx` (layout + guard)
- `src/routes/erp/index.tsx` (dashboard adapté au rôle)
- `src/routes/erp/stock.tsx`, `commandes.tsx`, `depot.tsx`, `logistique.tsx`, `clients.tsx`, `factures.tsx`, `finance.tsx`, `employes.tsx`, `messages.tsx`, `profile.tsx`

## Hors scope

- Pas d'authentification réelle (mock via switcheur).
- Pas de persistance backend (tout localStorage). Si vous voulez la vraie persistance multi-utilisateurs plus tard, on branchera Lovable Cloud avec tables + RLS.
- Le scan IA prend une **photo uploadée** (pas de caméra live native — sortie périmètre TanStack/web sans demande explicite).

Confirmez et je construis.
