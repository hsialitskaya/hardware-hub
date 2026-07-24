import { useEffect, useState } from "react";
import {
  createHardware,
  deleteHardware,
  listHardware,
  updateHardware,
} from "../api/hardware";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { HardwareFormModal } from "../components/HardwareFormModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { extractErrorMessage } from "../utils/errors";
import type { Hardware, HardwareInput } from "../types";

export function AdminHardwarePage() {
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Hardware | null>(null);
  const [deletingItem, setDeletingItem] = useState<Hardware | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listHardware();
      setHardware(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateOrUpdate = async (payload: HardwareInput) => {
    if (editingItem) {
      await updateHardware(editingItem.id, payload);
    } else {
      await createHardware(payload);
    }
    await loadData();
  };

  const handleToggleRepair = async (item: Hardware) => {
    setBusyId(item.id);
    setError(null);
    try {
      const nextStatus = item.status === "repair" ? "available" : "repair";
      await updateHardware(item.id, { status: nextStatus });
      await loadData();
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
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Zarządzanie sprzętem
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dodawaj, edytuj i usuwaj pozycje z inwentarza.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-violet-700"
        >
          + Dodaj sprzęt
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
        ) : hardware.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Brak sprzętu w inwentarzu.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Nazwa
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Marka
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Data zakupu
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hardware.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.brand}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.purchase_date ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleRepair(item)}
                        disabled={busyId === item.id}
                        className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        {item.status === "repair"
                          ? "Zakończ naprawę"
                          : "Zgłoś naprawę"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsFormOpen(true);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        title="Usuń sprzęt"
        message={`Czy na pewno chcesz usunąć „${deletingItem?.name}”? Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
