import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ErpLayout } from "@/components/erp/ErpLayout";
import { useErp } from "@/lib/erp/store";

export const Route = createFileRoute("/erp")({
  component: ErpRoot,
});

function ErpRoot() {
  const role = useErp((s) => s.role);
  if (role === "user") {
    // Soft redirect: render a CTA, since changing role isn't a navigation event
    if (typeof window !== "undefined") {
      throw redirect({ to: "/" });
    }
  }
  return (
    <ErpLayout>
      <Outlet />
    </ErpLayout>
  );
}
