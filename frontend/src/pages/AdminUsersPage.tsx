import { useEffect, useState } from "react";
import { createUser, deleteUser, listUsers } from "../api/users";
import type { CreateUserInput } from "../api/users";
import { UserFormModal } from "../components/UserFormModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { extractErrorMessage } from "../utils/errors";
import type { User } from "../types";

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = async (payload: CreateUserInput) => {
    await createUser(payload);
    await loadData();
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setBusyId(deletingUser.id);
    setError(null);
    try {
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Użytkownicy</h1>
          <p className="mt-1 text-sm text-slate-500">
            Konta tworzy wyłącznie administrator — to jedyny sposób uzyskania
            dostępu do systemu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-violet-700"
        >
          + Utwórz konto
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Rola
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Utworzono
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isLastAdmin = u.role === "admin" && adminCount === 1;
                const disableDelete = isSelf || isLastAdmin;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.email}
                      {isSelf && (
                        <span className="ml-2 text-xs text-indigo-500">
                          (Ty)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          u.role === "admin"
                            ? "bg-violet-100 text-violet-700 ring-violet-600/20"
                            : "bg-slate-100 text-slate-600 ring-slate-500/10"
                        }`}
                      >
                        {u.role === "admin" ? "Administrator" : "Użytkownik"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(u.created_at).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDeletingUser(u)}
                        disabled={disableDelete || busyId === u.id}
                        title={
                          isSelf
                            ? "Nie możesz usunąć własnego konta"
                            : isLastAdmin
                              ? "Nie można usunąć ostatniego administratora"
                              : undefined
                        }
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <UserFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!deletingUser}
        title="Usuń użytkownika"
        message={`Czy na pewno chcesz usunąć konto „${deletingUser?.email}”?`}
        confirmLabel="Usuń"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}
