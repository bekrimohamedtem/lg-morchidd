import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useErp } from "@/lib/erp/store";
import { Send, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/erp/messages")({ component: MessagesPage });

function MessagesPage() {
  const { messages, addMessage, role } = useErp();
  const canSend = role === "admin";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");

  const send = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Titre et message requis");
      return;
    }
    addMessage({ title, body, urgency });
    toast.success("Message envoyé à toute l'équipe");
    setTitle(""); setBody("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messagerie interne</h1>

      {canSend && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="font-semibold">Diffuser un message à toute l'équipe</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setUrgency("normal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${urgency === "normal" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
              >
                <Info className="h-3 w-3" /> Note normale (bleu)
              </button>
              <button
                onClick={() => setUrgency("urgent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${urgency === "urgent" ? "bg-[#A50034] text-white" : "bg-red-50 text-[#A50034]"}`}
              >
                <AlertTriangle className="h-3 w-3" /> Urgent (rouge)
              </button>
            </div>
            <button onClick={send} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
              <Send className="h-4 w-4" /> Envoyer
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`rounded-xl border-l-4 p-5 bg-white border border-slate-200 ${m.urgency === "urgent" ? "border-l-[#A50034] bg-red-50/40" : "border-l-blue-500 bg-blue-50/40"}`}>
            <div className="flex items-center gap-2">
              {m.urgency === "urgent" ? (
                <span className="text-xs font-bold text-[#A50034] bg-red-100 px-2 py-0.5 rounded">URGENT</span>
              ) : (
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">INFO</span>
              )}
              <h3 className="font-semibold">{m.title}</h3>
              <span className="text-xs text-slate-500 ml-auto">{new Date(m.date).toLocaleString("fr-DZ")}</span>
            </div>
            <p className="text-sm text-slate-700 mt-2">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
