import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useErp } from "@/lib/erp/store";
import { DataTable } from "@/components/erp/DataTable";
import { ROLES, type Employee } from "@/lib/erp/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/erp/employes")({ component: EmployesPage });

const empty: Employee = { id: "", fullName: "", role: "commercial", email: "", phone: "", hiredAt: new Date().toISOString().slice(0, 10) };

function EmployesPage() {
  const { employees, upsertEmployee, deleteEmployee } = useErp();
  const [edit, setEdit] = useState<Employee | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Employés</h1>
      <DataTable
        title="Personnel"
        rows={employees}
        actions={
          <button onClick={() => setEdit({ ...empty, id: "e-" + Math.random().toString(36).slice(2, 8) })} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#A50034]">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        }
        columns={[
          { key: "name", header: "Nom", render: (e) => <span className="font-medium">{e.fullName}</span>, searchValue: (e) => e.fullName },
          { key: "role", header: "Rôle", render: (e) => <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">{ROLES.find((r) => r.id === e.role)?.label}</span> },
          { key: "email", header: "Email", render: (e) => e.email, searchValue: (e) => e.email },
          { key: "phone", header: "Téléphone", render: (e) => e.phone },
          { key: "date", header: "Embauche", render: (e) => new Date(e.hiredAt).toLocaleDateString("fr-DZ") },
          {
            key: "act", header: "Actions", render: (e) => (
              <div className="flex gap-1">
                <button onClick={() => setEdit(e)} className="p-1.5 bg-blue-100 text-blue-600 rounded-md"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => deleteEmployee(e.id)} className="p-1.5 bg-red-100 text-[#A50034] rounded-md"><Trash2 className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
      />
      {edit && (
        <EmployeeModal
          employee={edit}
          onSave={(e) => { upsertEmployee(e); setEdit(null); }}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}

function EmployeeModal({ employee, onSave, onClose }: { employee: Employee; onSave: (e: Employee) => void; onClose: () => void }) {
  const [e, setE] = useState(employee);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-3">
        <h2 className="text-xl font-bold">{employee.fullName ? "Modifier" : "Nouvel"} employé</h2>
        <Field label="Nom complet"><input value={e.fullName} onChange={(ev) => setE({ ...e, fullName: ev.target.value })} className="inp" /></Field>
        <Field label="Email"><input value={e.email} onChange={(ev) => setE({ ...e, email: ev.target.value })} className="inp" /></Field>
        <Field label="Téléphone"><input value={e.phone} onChange={(ev) => setE({ ...e, phone: ev.target.value })} className="inp" /></Field>
        <Field label="Rôle">
          <select value={e.role} onChange={(ev) => setE({ ...e, role: ev.target.value as never })} className="inp">
            {ROLES.filter((r) => r.id !== "user").map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Date d'embauche"><input type="date" value={e.hiredAt.slice(0, 10)} onChange={(ev) => setE({ ...e, hiredAt: ev.target.value })} className="inp" /></Field>
        <div className="flex justify-end gap-2 pt-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm">Annuler</button>
          <button onClick={() => onSave(e)} className="px-4 py-2 rounded-lg bg-[#A50034] text-white text-sm font-semibold">Enregistrer</button>
        </div>
        <style>{`.inp { width:100%; padding:0.5rem 0.75rem; border:1px solid #e2e8f0; border-radius:0.5rem; font-size:0.875rem; outline:none; } .inp:focus { border-color:#A50034; }`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-sm font-medium block mb-1">{label}</label>{children}</div>;
}
