import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useErp } from "@/lib/erp/store";
import { ROLES } from "@/lib/erp/types";
import { Send, Users, Search, Circle } from "lucide-react";

export const Route = createFileRoute("/erp/chat")({ component: ChatPage });

const dmId = (a: string, b: string) => {
  const [x, y] = [a, b].sort();
  return `dm:${x}:${y}`;
};

function ChatPage() {
  const { employees, chats, sendChat, role } = useErp();
  // current user: pick first employee matching current role, else admin
  const me = useMemo(
    () => employees.find((e) => e.role === role) ?? employees.find((e) => e.role === "admin") ?? employees[0],
    [employees, role],
  );
  const others = employees.filter((e) => e.id !== me.id);

  const [activeConv, setActiveConv] = useState<string>("group");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const convMessages = useMemo(
    () => chats.filter((c) => c.conversationId === activeConv).sort((a, b) => a.date.localeCompare(b.date)),
    [chats, activeConv],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [convMessages.length, activeConv]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    sendChat(activeConv, me.id, body);
    setDraft("");
  };

  const empById = (id: string) => employees.find((e) => e.id === id);
  const roleLabel = (r: string) => ROLES.find((x) => x.id === r)?.label ?? r;

  const filteredOthers = others.filter((e) =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    roleLabel(e.role).toLowerCase().includes(search.toLowerCase()),
  );

  const lastOf = (convId: string) => {
    const list = chats.filter((c) => c.conversationId === convId);
    return list.length ? list[list.length - 1] : null;
  };

  const activeHeader = activeConv === "group"
    ? { name: "Groupe — Toute l'équipe", sub: `${employees.length} membres · supérieurs inclus` }
    : (() => {
        const id = activeConv.replace("dm:", "").split(":").find((x) => x !== me.id) ?? "";
        const e = empById(id);
        return { name: e?.fullName ?? "Conversation", sub: e ? roleLabel(e.role) : "" };
      })();

  return (
    <div className="h-[calc(100vh-9rem)] flex bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Chat équipe</h2>
          <p className="text-xs text-slate-500">Connecté en tant que <span className="font-semibold">{me.fullName}</span></p>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un employé…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-[#A50034]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {/* Group */}
          <button
            onClick={() => setActiveConv("group")}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition ${
              activeConv === "group" ? "bg-[#A50034] text-white" : "hover:bg-white"
            }`}
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
              activeConv === "group" ? "bg-white/20" : "bg-[#A50034] text-white"
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">Groupe général</div>
              <div className={`text-xs truncate ${activeConv === "group" ? "text-white/80" : "text-slate-500"}`}>
                {lastOf("group")?.body ?? "Démarrez la discussion…"}
              </div>
            </div>
          </button>

          <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Discussions privées
          </div>

          {filteredOthers.map((e) => {
            const conv = dmId(me.id, e.id);
            const active = activeConv === conv;
            const last = lastOf(conv);
            const isSuperior = e.role === "admin" || e.role === "comptable";
            return (
              <button
                key={e.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition ${
                  active ? "bg-[#A50034] text-white" : "hover:bg-white"
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {e.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  {isSuperior && (
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate flex items-center gap-1">
                    {e.fullName}
                    {isSuperior && <span className={`text-[9px] font-bold px-1 rounded ${active ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>SUP.</span>}
                  </div>
                  <div className={`text-xs truncate ${active ? "text-white/80" : "text-slate-500"}`}>
                    {last?.body ?? roleLabel(e.role)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 px-6 flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 rounded-full bg-[#A50034] text-white flex items-center justify-center">
            {activeConv === "group" ? <Users className="h-5 w-5" /> : <span className="text-sm font-bold">{activeHeader.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{activeHeader.name}</div>
            <div className="text-xs text-slate-500 truncate">{activeHeader.sub}</div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-3">
          {convMessages.length === 0 && (
            <div className="text-center text-sm text-slate-400 mt-20">Aucun message — commencez la conversation.</div>
          )}
          {convMessages.map((m) => {
            const mine = m.senderId === me.id;
            const sender = empById(m.senderId);
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <div className="h-8 w-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {sender?.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("") ?? "?"}
                  </div>
                )}
                <div className={`max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!mine && activeConv === "group" && (
                    <div className="text-[11px] font-semibold text-slate-600 px-1">
                      {sender?.fullName} · <span className="text-slate-400 font-normal">{roleLabel(sender?.role ?? "")}</span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                      mine
                        ? "bg-[#A50034] text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {m.body}
                  </div>
                  <div className={`text-[10px] text-slate-400 px-1 ${mine ? "text-right" : "text-left"}`}>
                    {new Date(m.date).toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="border-t border-slate-200 p-4 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={`Message à ${activeHeader.name}…`}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#A50034] max-h-32"
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              className="h-11 w-11 rounded-xl bg-[#A50034] text-white flex items-center justify-center hover:bg-[#8a002b] disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
