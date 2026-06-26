import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const ssrSafeStorage = () => {
  if (typeof window === "undefined") {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return window.localStorage;
};
import type {
  Role, StockItem, Client, Order, Employee, Movement, Notification, AdminMessage, OrderItem,
} from "./types";
import { seedStock, seedClients, seedOrders, seedEmployees, seedMovements, seedMessages } from "./seed";

type State = {
  role: Role;
  stock: StockItem[];
  clients: Client[];
  orders: Order[];
  employees: Employee[];
  movements: Movement[];
  notifications: Notification[];
  messages: AdminMessage[];
};

type Actions = {
  setRole: (r: Role) => void;
  // stock
  upsertStock: (s: StockItem) => void;
  deleteStock: (id: string) => void;
  adjustStock: (productId: string, delta: number, type: "entrée" | "sortie", depot: string, note?: string) => void;
  // clients
  upsertClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  // orders
  addOrder: (clientId: string, items: OrderItem[], commercialId: string) => Order | null;
  setOrderStatus: (id: string, s: Order["status"]) => void;
  // employees
  upsertEmployee: (e: Employee) => void;
  deleteEmployee: (id: string) => void;
  // notif
  pushNotification: (n: Omit<Notification, "id" | "date" | "read">) => void;
  markAllRead: () => void;
  // messages
  addMessage: (m: Omit<AdminMessage, "id" | "date">) => void;
};

const newId = () => Math.random().toString(36).slice(2, 10);

export const useErp = create<State & Actions>()(
  persist(
    (set, get) => ({
      role: "admin",
      stock: seedStock,
      clients: seedClients,
      orders: seedOrders,
      employees: seedEmployees,
      movements: seedMovements,
      notifications: [],
      messages: seedMessages,

      setRole: (role) => set({ role }),

      upsertStock: (s) =>
        set((st) => ({
          stock: st.stock.some((x) => x.id === s.id)
            ? st.stock.map((x) => (x.id === s.id ? s : x))
            : [...st.stock, s],
        })),
      deleteStock: (id) => set((st) => ({ stock: st.stock.filter((x) => x.id !== id) })),
      adjustStock: (productId, delta, type, depot, note) =>
        set((st) => ({
          stock: st.stock.map((p) =>
            p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
          ),
          movements: [
            { id: newId(), productId, type, qty: Math.abs(delta), depot, date: new Date().toISOString(), note },
            ...st.movements,
          ],
        })),

      upsertClient: (c) =>
        set((st) => ({
          clients: st.clients.some((x) => x.id === c.id)
            ? st.clients.map((x) => (x.id === c.id ? c : x))
            : [...st.clients, c],
        })),
      deleteClient: (id) => set((st) => ({ clients: st.clients.filter((c) => c.id !== id) })),

      addOrder: (clientId, items, commercialId) => {
        const st = get();
        const client = st.clients.find((c) => c.id === clientId);
        if (!client) return null;
        let total = 0, totalInitial = 0;
        for (const it of items) {
          const p = st.stock.find((x) => x.id === it.productId);
          if (!p) continue;
          total += p.priceSale * it.quantity;
          totalInitial += p.priceInitial * it.quantity;
        }
        const order: Order = {
          id: newId(),
          ref: `CMD-${new Date().getFullYear()}-${String(st.orders.length + 1).padStart(4, "0")}`,
          client, items, commercialId, status: "En attente",
          createdAt: new Date().toISOString(), total, totalInitial,
        };
        set({
          orders: [order, ...st.orders],
          stock: st.stock.map((p) => {
            const it = items.find((i) => i.productId === p.id);
            return it ? { ...p, stock: Math.max(0, p.stock - it.quantity) } : p;
          }),
        });
        return order;
      },
      setOrderStatus: (id, s) =>
        set((st) => ({ orders: st.orders.map((o) => (o.id === id ? { ...o, status: s } : o)) })),

      upsertEmployee: (e) =>
        set((st) => ({
          employees: st.employees.some((x) => x.id === e.id)
            ? st.employees.map((x) => (x.id === e.id ? e : x))
            : [...st.employees, e],
        })),
      deleteEmployee: (id) => set((st) => ({ employees: st.employees.filter((e) => e.id !== id) })),

      pushNotification: (n) =>
        set((st) => ({
          notifications: [
            { id: newId(), date: new Date().toISOString(), read: false, ...n },
            ...st.notifications,
          ].slice(0, 50),
        })),
      markAllRead: () => set((st) => ({ notifications: st.notifications.map((n) => ({ ...n, read: true })) })),

      addMessage: (m) =>
        set((st) => ({
          messages: [{ id: newId(), date: new Date().toISOString(), ...m }, ...st.messages],
        })),
    }),
    { name: "lg-morchid-erp", version: 1, storage: createJSONStorage(ssrSafeStorage), skipHydration: true },
  ),
);

export const fmtDA = (n: number) =>
  new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(n);
