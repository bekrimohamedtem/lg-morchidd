import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useErp } from "@/lib/erp/store";

export function StockAlerts() {
  const role = useErp((s) => s.role);
  const stock = useErp((s) => s.stock);
  const push = useErp((s) => s.pushNotification);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (role === "user") return;
    for (const p of stock) {
      if (p.stock <= 2 && !seen.current.has(p.id + ":" + p.stock)) {
        seen.current.add(p.id + ":" + p.stock);
        const msg =
          p.stock === 0
            ? `Rupture de stock : ${p.name}`
            : `Stock critique (${p.stock}) : ${p.name}`;
        toast.error(msg, { description: `Dépôt ${p.depot}` });
        push({ kind: "stock", message: msg });
      }
    }
  }, [stock, role, push]);

  return null;
}
