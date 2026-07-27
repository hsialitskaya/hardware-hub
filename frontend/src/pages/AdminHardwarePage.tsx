import { useEffect, useState } from "react";
import {
  createHardware,
  deleteHardware,
  listHardware,
  updateHardware,
} from "../api/hardware";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { Pagination } from "../components/Pagination";
import { HardwareFormModal } from "../components/HardwareFormModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { extractErrorMessage } from "../utils/errors";
import type { Hardware, HardwareInput } from "../types";

type SortKey = "name" | "brand" | "serial_number" | "purchase_date" | "status";
type SortDirection = "asc" | "desc";

function EditIcon({ className }: { className?: string }) {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
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
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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

export function AdminHardwarePage() {
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Hardware | null>(null);
  const [deletingItem, setDeletingItem] = useState<Hardware | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadData = async (currentPage: number = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listHardware({
        page: currentPage,
        page_size: pageSize,
        sort_by: sortKey,
        sort_direction: sortDirection,
      });
      setHardware(data.items);
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

  const handleCreateOrUpdate = async (payload: HardwareInput) => {
    if (editingItem) {
      await updateHardware(editingItem.id, payload);
    } else {
      await createHardware(payload);
    }
    await loadData(1);
  };

  const handleToggleRepair = async (item: Hardware) => {
    setBusyId(item.id);
    setError(null);
    try {
      const nextStatus = item.status === "repair" ? "available" : "repair";
      await updateHardware(item.id, { status: nextStatus });
      await loadData(page);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setBusyId(deletingItem.id);
    setError(null);
    try {
      await deleteHardware(deletingItem.id);
      setDeletingItem(null);
      await loadData(page);
    } catch (err) {
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Hardware Management
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900"
        >
          <PlusIcon className="h-4 w-4" />
          Add New Device
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
        ) : hardware.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No hardware in inventory.
          </div>
        ) : (
          <table className="min-w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-900">
                {sortableHeader("name", "Device Name")}
                {sortableHeader("brand", "Brand")}
                {sortableHeader("serial_number", "Serial Number")}
                {sortableHeader("purchase_date", "Date Added")}
                {sortableHeader("status", "Status")}
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hardware.map((item, index) => (
                <tr
                  key={item.id}
                  className={`${
                    index % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                  } border-b border-gray-100 last:border-b-0 hover:bg-gray-50`}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.brand}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {item.serial_number ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.purchase_date ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsFormOpen(true);
                        }}
                        className="text-gray-500 transition hover:text-gray-900"
                        title="Edit"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleRepair(item)}
                        disabled={
                          busyId === item.id || item.status === "in_use"
                        }
                        className="text-gray-500 transition hover:text-gray-900 disabled:opacity-40"
                        title={
                          item.status === "repair"
                            ? "End Repair"
                            : item.status === "in_use"
                              ? "Cannot repair while rented"
                              : "Repair"
                        }
                      >
                        <WrenchIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        disabled={item.status === "in_use"}
                        className="text-red-500 transition hover:text-red-700 disabled:opacity-40"
                        title={
                          item.status === "in_use"
                            ? "Cannot delete while rented"
                            : "Delete"
                        }
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && hardware.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <HardwareFormModal
        open={isFormOpen}
        initialValue={editingItem}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />

      <ConfirmDialog
        open={!!deletingItem}
        title="Delete Hardware"
        message={`Are you sure you want to delete ${deletingItem?.name} with serial number ${deletingItem?.serial_number}? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
