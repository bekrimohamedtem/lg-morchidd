import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useErp } from "@/lib/erp/store";
import { ROLES, type Role } from "@/lib/erp/types";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Truck, Users,
  FileText, Wallet, UserCog, MessageSquare, Bell, Menu, ChevronLeft,
  User as UserIcon, AlertTriangle, Search, Sparkles, MessagesSquare,
  StickyNote,
} from "lucide-react";

type NavItem = { to: LinkProps["to"]; label: string; icon: typeof LayoutDashboard; roles: Role[] };

const NAV: NavItem[] = [
  { to: "/erp", label: "Dashboard", icon: LayoutDashboard, roles: ["comptable", "admin"] },
  { to: "/erp/stock", label: "Stock", icon: Package, roles: ["commercial", "depot", "admin"] },
  { to: "/erp/commandes", label: "Commandes", icon: ShoppingCart, roles: ["commercial", "vendeur", "comptable", "admin"] },
  { to: "/erp/depot", label: "Dépôt", icon: Warehouse, roles: ["depot", "admin"] },
  { to: "/erp/logistique", label: "Logistique", icon: Truck, roles: ["depot", "admin"] },
  { to: "/erp/clients", label: "Clients", icon: Users, roles: ["vendeur", "admin"] },
  { to: "/erp/factures", label: "Factures", icon: FileText, roles: ["vendeur", "comptable", "admin"] },
  { to: "/erp/finance", label: "Finance", icon: Wallet, roles: ["comptable", "admin"] },
  { to: "/erp/insights", label: "Savoir plus (IA)", icon: Sparkles, roles: ["comptable", "admin"] },
  { to: "/erp/employes", label: "Employés", icon: UserCog, roles: ["admin"] },
  { to: "/erp/chat", label: "Chat", icon: MessagesSquare, roles: ["commercial", "depot", "vendeur", "comptable", "admin"] },
  { to: "/erp/messages", label: "Notes supérieures", icon: MessageSquare, roles: ["commercial", "depot", "vendeur", "comptable", "admin"] },
  { to: "/erp/profile", label: "Profil", icon: UserIcon, roles: ["commercial", "depot", "vendeur", "comptable", "admin"] },

];

export function ErpLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const role = useErp((s) => s.role);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV.filter((n) => n.roles.includes(role));
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? role;
  const notifications = useErp((s) => s.notifications);
  const markAllRead = useErp((s) => s.markAllRead);
  const messages = useErp((s) => s.messages);
  const unread = notifications.filter((n) => !n.read).length;
  const [openBell, setOpenBell] = useState(false);
  const [openMsg, setOpenMsg] = useState(false);
  const urgentCount = messages.filter((m) => m.urgency === "urgent").length;

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-20" : "w-64"} bg-[#0f1115] text-white flex flex-col transition-all duration-300 sticky top-0 h-screen`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-[#A50034]">LG</span>
              <span className="text-xl font-light">-morchid</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded-md hover:bg-white/10"
            aria-label="Réduire la barre"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to || (it.to !== "/erp" && pathname.startsWith(it.to as string));
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active ? "bg-[#A50034] text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{it.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <UserIcon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">John Doe</div>
              <div className="text-xs text-white/50 truncate">{roleLabel}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none focus:border-[#A50034] focus:bg-white"
                placeholder="Rechercher…"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button onClick={() => { setOpenMsg((v) => !v); setOpenBell(false); }} className="relative p-2 rounded-full hover:bg-slate-100">
              <MessageSquare className="h-5 w-5 text-slate-700" />
              {urgentCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#A50034]" />
              )}
            </button>
            <button onClick={() => { setOpenBell((v) => !v); setOpenMsg(false); if (!openBell) markAllRead(); }} className="relative p-2 rounded-full hover:bg-slate-100">
              <Bell className="h-5 w-5 text-slate-700" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-[#A50034] text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unread}
                </span>
              )}
            </button>
            <div className="text-right pr-3 hidden sm:block">
              <div className="text-sm font-semibold leading-tight">John Doe</div>
              <div className="text-xs text-slate-500 leading-tight">{roleLabel}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-slate-600" />
            </div>

            {openBell && (
              <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 max-h-96 overflow-y-auto">
                <div className="font-semibold text-sm mb-2">Notifications</div>
                {notifications.length === 0 && <div className="text-xs text-slate-500 py-6 text-center">Aucune notification</div>}
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-2 py-2 border-b border-slate-100 last:border-0">
                    <AlertTriangle className="h-4 w-4 text-[#A50034] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium">{n.message}</div>
                      <div className="text-[10px] text-slate-400">{new Date(n.date).toLocaleString("fr-DZ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {openMsg && (
              <div className="absolute top-12 right-0 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 max-h-96 overflow-y-auto">
                <div className="font-semibold text-sm mb-2">Messages de la direction</div>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 mb-2 rounded-lg border-l-4 ${
                      m.urgency === "urgent" ? "bg-red-50 border-[#A50034]" : "bg-blue-50 border-blue-500"
                    }`}
                  >
                    <div className={`text-xs font-bold ${m.urgency === "urgent" ? "text-[#A50034]" : "text-blue-700"}`}>
                      {m.urgency === "urgent" ? "URGENT" : "INFO"} — {m.title}
                    </div>
                    <div className="text-xs text-slate-700 mt-1">{m.body}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{new Date(m.date).toLocaleString("fr-DZ")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white text-center text-xs text-slate-500 py-4">
          © {new Date().getFullYear()} LG-morchid ERP. Tous droits réservés.
        </footer>
      </div>
    </div>
  );
}
