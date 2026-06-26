import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useErp } from "@/lib/erp/store";
import { ROLES, type Role } from "@/lib/erp/types";
import { UserCog } from "lucide-react";

export function RoleSwitcher() {
  const role = useErp((s) => s.role);
  const setRole = useErp((s) => s.setRole);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const onChange = (r: Role) => {
    setRole(r);
    if (r === "user") {
      if (pathname.startsWith("/erp")) {
        navigate({ to: "/" });
      }
    } else {
      const defaultRoutes: Record<Role, string> = {
        user: "/",
        admin: "/erp",
        comptable: "/erp",
        commercial: "/erp/stock",
        depot: "/erp/stock",
        vendeur: "/erp/commandes"
      };
      navigate({ to: defaultRoutes[r] as any });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#1a1a1a] text-white rounded-full shadow-2xl border border-white/10 flex items-center gap-2 pl-3 pr-1 py-1">
      <UserCog className="h-4 w-4 text-[#A50034]" />
      <span className="text-xs uppercase tracking-wider opacity-70">Rôle</span>
      <select
        value={role}
        onChange={(e) => onChange(e.target.value as Role)}
        className="bg-[#A50034] text-white text-sm font-semibold rounded-full px-3 py-1.5 outline-none cursor-pointer"
      >
        {ROLES.map((r) => (
          <option key={r.id} value={r.id} className="bg-[#1a1a1a]">
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}
