export type Role = "user" | "commercial" | "depot" | "vendeur" | "comptable" | "admin";

export const ROLES: { id: Role; label: string }[] = [
  { id: "user", label: "Utilisateur" },
  { id: "commercial", label: "Commercial" },
  { id: "depot", label: "Agent de dépôt" },
  { id: "vendeur", label: "Vendeur" },
  { id: "comptable", label: "Comptable" },
  { id: "admin", label: "Admin" },
];

export type StockItem = {
  id: string;
  ref: string;
  name: string;
  category: "TV" | "Climatiseur" | "Lave-linge" | "Réfrigérateur" | "Audio";
  depot: string;
  dimensions: string;
  priceInitial: number;
  priceSale: number;
  stock: number;
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  type: "standard" | "convention";
};

export type OrderItem = { productId: string; quantity: number };

export type Order = {
  id: string;
  ref: string;
  client: Client;
  items: OrderItem[];
  commercialId: string;
  status: "En attente" | "En cours de livraison" | "Livré" | "Retourné";
  createdAt: string;
  total: number;
  totalInitial: number;
  channel: "site" | "showroom";
};

export type Employee = {
  id: string;
  fullName: string;
  role: Role;
  email: string;
  phone: string;
  hiredAt: string;
};

export type Movement = {
  id: string;
  productId: string;
  type: "entrée" | "sortie";
  qty: number;
  depot: string;
  date: string;
  note?: string;
};

export type Notification = {
  id: string;
  kind: "stock" | "info";
  message: string;
  date: string;
  read: boolean;
};

export type AdminMessage = {
  id: string;
  title: string;
  body: string;
  urgency: "urgent" | "normal";
  date: string;
};
