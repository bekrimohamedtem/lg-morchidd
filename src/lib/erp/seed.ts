import type { StockItem, Client, Order, Employee, Movement, AdminMessage } from "./types";

const uid = (p: string, i: number) => `${p}-${i.toString().padStart(3, "0")}`;

export const seedStock: StockItem[] = [
  { id: uid("p", 1), ref: "OLED-C4-65", name: "LG OLED evo C4 65\"", category: "TV", depot: "Alger Centre", dimensions: "144x83x4 cm", priceInitial: 180000, priceSale: 249000, stock: 8 },
  { id: uid("p", 2), ref: "QNED-80-55", name: "LG QNED 80 55\"", category: "TV", depot: "Oran", dimensions: "122x71x6 cm", priceInitial: 90000, priceSale: 129000, stock: 2 },
  { id: uid("p", 3), ref: "DUAL-INV-18", name: "Climatiseur Dual Inverter 18000 BTU", category: "Climatiseur", depot: "Alger Centre", dimensions: "99x33x21 cm", priceInitial: 110000, priceSale: 159000, stock: 5 },
  { id: uid("p", 4), ref: "DUAL-INV-12", name: "Climatiseur Dual Inverter 12000 BTU", category: "Climatiseur", depot: "Constantine", dimensions: "84x29x21 cm", priceInitial: 75000, priceSale: 109000, stock: 1 },
  { id: uid("p", 5), ref: "WM-AI-9KG", name: "Lave-linge AI DD 9kg", category: "Lave-linge", depot: "Oran", dimensions: "60x60x85 cm", priceInitial: 65000, priceSale: 94000, stock: 12 },
  { id: uid("p", 6), ref: "FR-INST-635", name: "Réfrigérateur InstaView 635L", category: "Réfrigérateur", depot: "Alger Centre", dimensions: "91x73x179 cm", priceInitial: 145000, priceSale: 215000, stock: 0 },
  { id: uid("p", 7), ref: "SB-SC9S", name: "Barre de son SC9S Dolby Atmos", category: "Audio", depot: "Constantine", dimensions: "125x6x6 cm", priceInitial: 55000, priceSale: 79000, stock: 6 },
  { id: uid("p", 8), ref: "FR-MULTI-420", name: "Réfrigérateur Multi-Door 420L", category: "Réfrigérateur", depot: "Oran", dimensions: "83x73x180 cm", priceInitial: 95000, priceSale: 139000, stock: 2 },
];

export const seedClients: Client[] = [
  { id: uid("c", 1), firstName: "Ahmed", lastName: "Benali", phone: "0555 12 34 56", address: "12 rue Didouche, Alger", type: "standard" },
  { id: uid("c", 2), firstName: "Karim", lastName: "Haddad", phone: "0555 98 76 54", address: "5 av. de l'ALN, Oran", type: "convention" },
  { id: uid("c", 3), firstName: "Sofiane", lastName: "Mansouri", phone: "0666 11 22 33", address: "Cité Daksi, Constantine", type: "standard" },
];

export const seedEmployees: Employee[] = [
  { id: uid("e", 1), fullName: "Yacine Belkacem", role: "commercial", email: "y.belkacem@lg-morchid.dz", phone: "0770 11 22 33", hiredAt: "2024-03-12" },
  { id: uid("e", 2), fullName: "Nadia Cherif", role: "commercial", email: "n.cherif@lg-morchid.dz", phone: "0771 44 55 66", hiredAt: "2024-06-01" },
  { id: uid("e", 3), fullName: "Mohamed Kaddour", role: "depot", email: "m.kaddour@lg-morchid.dz", phone: "0772 77 88 99", hiredAt: "2023-11-20" },
  { id: uid("e", 4), fullName: "Lina Saadi", role: "vendeur", email: "l.saadi@lg-morchid.dz", phone: "0773 22 33 44", hiredAt: "2025-01-15" },
  { id: uid("e", 5), fullName: "Omar Hadj", role: "comptable", email: "o.hadj@lg-morchid.dz", phone: "0774 55 66 77", hiredAt: "2023-08-05" },
  { id: uid("e", 6), fullName: "John Doe", role: "admin", email: "admin@lg-morchid.dz", phone: "0775 00 00 00", hiredAt: "2023-01-01" },
];

const today = new Date();
const iso = (d: Date) => d.toISOString();
const days = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };

export const seedOrders: Order[] = [
  { id: uid("o", 1), ref: "CMD-2026-0001", client: seedClients[0], items: [{ productId: "p-001", quantity: 1 }, { productId: "p-007", quantity: 1 }],
    commercialId: "e-001", status: "Livré", createdAt: iso(days(28)),
    total: 249000 + 79000, totalInitial: 180000 + 55000 },
  { id: uid("o", 2), ref: "CMD-2026-0002", client: seedClients[1], items: [{ productId: "p-003", quantity: 2 }],
    commercialId: "e-002", status: "Livré", createdAt: iso(days(25)),
    total: 159000 * 2, totalInitial: 110000 * 2 },
  { id: uid("o", 3), ref: "CMD-2026-0003", client: seedClients[2], items: [{ productId: "p-005", quantity: 1 }],
    commercialId: "e-001", status: "Livré", createdAt: iso(days(21)),
    total: 94000, totalInitial: 65000 },
  { id: uid("o", 4), ref: "CMD-2026-0004", client: seedClients[0], items: [{ productId: "p-002", quantity: 1 }],
    commercialId: "e-002", status: "Livré", createdAt: iso(days(18)),
    total: 129000, totalInitial: 90000 },
  { id: uid("o", 5), ref: "CMD-2026-0005", client: seedClients[1], items: [{ productId: "p-008", quantity: 2 }],
    commercialId: "e-001", status: "Livré", createdAt: iso(days(14)),
    total: 139000 * 2, totalInitial: 95000 * 2 },
  { id: uid("o", 6), ref: "CMD-2026-0006", client: seedClients[2], items: [{ productId: "p-005", quantity: 1 }, { productId: "p-007", quantity: 1 }],
    commercialId: "e-002", status: "Livré", createdAt: iso(days(10)),
    total: 94000 + 79000, totalInitial: 65000 + 55000 },
  { id: uid("o", 7), ref: "CMD-2026-0007", client: seedClients[0], items: [{ productId: "p-001", quantity: 1 }],
    commercialId: "e-001", status: "Livré", createdAt: iso(days(7)),
    total: 249000, totalInitial: 180000 },
  { id: uid("o", 8), ref: "CMD-2026-0008", client: seedClients[1], items: [{ productId: "p-003", quantity: 1 }],
    commercialId: "e-002", status: "En cours de livraison", createdAt: iso(days(4)),
    total: 159000, totalInitial: 110000 },
  { id: uid("o", 9), ref: "CMD-2026-0009", client: seedClients[2], items: [{ productId: "p-005", quantity: 2 }],
    commercialId: "e-001", status: "En cours de livraison", createdAt: iso(days(2)),
    total: 94000 * 2, totalInitial: 65000 * 2 },
  { id: uid("o", 10), ref: "CMD-2026-0010", client: seedClients[0], items: [{ productId: "p-007", quantity: 1 }],
    commercialId: "e-002", status: "En attente", createdAt: iso(days(0)),
    total: 79000, totalInitial: 55000 },
];

export const seedMovements: Movement[] = [
  { id: uid("m", 1), productId: "p-001", type: "entrée", qty: 10, depot: "Alger Centre", date: iso(days(10)), note: "Réception conteneur" },
  { id: uid("m", 2), productId: "p-001", type: "sortie", qty: 2, depot: "Alger Centre", date: iso(days(5)), note: "Commande CMD-2026-0001" },
  { id: uid("m", 3), productId: "p-004", type: "sortie", qty: 4, depot: "Constantine", date: iso(days(3)) },
];

export const seedMessages: AdminMessage[] = [
  { id: uid("msg", 1), title: "Inventaire mensuel", body: "Inventaire général des dépôts vendredi 17h.", urgency: "normal", date: iso(days(1)) },
  { id: uid("msg", 2), title: "URGENT — Rupture climatiseurs", body: "Stop ventes climatiseurs 12000 BTU jusqu'à réception.", urgency: "urgent", date: iso(days(0)) },
];
