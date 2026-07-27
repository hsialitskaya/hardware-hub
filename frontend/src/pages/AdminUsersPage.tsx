import { useEffect, useState } from "react";
import { createUser, deleteUser, listUsers } from "../api/users";
import type { CreateUserInput } from "../api/users";
import { UserFormModal } from "../components/UserFormModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Spinner } from "../components/Spinner";
import { Pagination } from "../components/Pagination";
import { useAuth } from "../hooks/useAuth";
import { extractErrorMessage } from "../utils/errors";
import type { User } from "../types";

type SortKey = "email" | "role" | "created_at";
type SortDirection = "asc" | "desc";

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadData = async (currentPage: number = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listUsers(
        currentPage,
        pageSize,
        sortKey,
        sortDirection,
      );
      setUsers(data.items);
      setTotalItems(data.total);
      setPage(data.page);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData(1);
  }, [sortKey, sortDirection]);

  const handleCreate = async (payload: CreateUserInput) => {
    await createUser(payload);
    await loadData(1);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setBusyId(deletingUser.id);
    setError(null);
    try {
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
      await loadData(page);
    } catch (err) {
      setDeletingUser(null);
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handlePageChange = (nextPage: number) => {
    void loadData(nextPage);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const sortableHeader = (key: SortKey, label: string) => (
    <th
      onClick={() => toggleSort(key)}
      className="cursor-pointer px-6 py-4 font-semibold"
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === key && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
      </div>
    </th>
  );

  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Users Management
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900"
        >
          <PlusIcon className="h-4 w-4" />
          Create Account
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <table className="min-w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-900">
                {sortableHeader("email", "Email")}
                {sortableHeader("role", "Role")}
                {sortableHeader("created_at", "Created")}
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => {
                const isSelf = u.id === currentUser?.id;
                const isLastAdmin = u.role === "admin" && adminCount === 1;
                const disableDelete = isSelf || isLastAdmin;
                return (
                  <tr
                    key={u.id}
                    className={`${
                      index % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                    } border-b border-gray-100 last:border-b-0 hover:bg-gray-50`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {u.email}
                      {isSelf && (
                        <span className="ml-2 text-xs text-gray-500">
                          (You)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-gray-950 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(u.created_at).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setDeletingUser(u)}
                          disabled={disableDelete || busyId === u.id}
                          title={
                            isSelf
                              ? "You cannot delete your own account"
                              : isLastAdmin
                                ? "Cannot delete the last administrator"
                                : "Delete"
                          }
                          className="text-red-500 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && users.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <UserFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!deletingUser}
        title="Delete User"
        message={`Are you sure you want to delete the account "${deletingUser?.email}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}
