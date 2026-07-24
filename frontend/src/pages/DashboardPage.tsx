import { useEffect, useMemo, useState } from "react";
import { listHardware } from "../api/hardware";
import { myRentals, rentHardware, returnHardware } from "../api/rentals";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import { extractErrorMessage } from "../utils/errors";
import type { Hardware, HardwareStatus, Rental } from "../types";

type SortKey = "name" | "brand" | "purchase_date" | "status";
type SortDirection = "asc" | "desc";

const STATUS_FILTERS: { value: HardwareStatus | ""; label: string }[] = [
  { value: "", label: "Wszystkie statusy" },
  { value: "available", label: "Dostępne" },
  { value: "in_use", label: "W użyciu" },
  { value: "repair", label: "Naprawa" },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [hardware, setHardware] = useState<Hardware[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<HardwareStatus | "">("");
  const [brandFilterInput, setBrandFilterInput] = useState("");
  const brandFilter = useDebounce(brandFilterInput, 300);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [hw, myActiveRentals] = await Promise.all([
          listHardware({ status: statusFilter, brand: brandFilter }),
          myRentals(),
        ]);
        if (!cancelled) {
          setHardware(hw);
          setRentals(myActiveRentals);
        }
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, brandFilter]);

  const refresh = async () => {
    const [hw, myActiveRentals] = await Promise.all([
      listHardware({ status: statusFilter, brand: brandFilter }),
      myRentals(),
    ]);
    setHardware(hw);
    setRentals(myActiveRentals);
  };

  const activeRentalByHardwareId = useMemo(() => {
    const map = new Map<number, Rental>();
    for (const rental of rentals) {
      if (rental.returned_at === null && rental.user_id === user?.id) {
        map.set(rental.hardware_id, rental);
      }
    }
    return map;
  }, [rentals, user]);

  const sortedHardware = useMemo(() => {
    const items = [...hardware];
    items.sort((a, b) => {
      const aValue = a[sortKey] ?? "";
      const bValue = b[sortKey] ?? "";
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return items;
  }, [hardware, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleRent = async (hardwareId: number) => {
    setPendingId(hardwareId);
    setActionError(null);
    try {
      await rentHardware(hardwareId);
      await refresh();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handleReturn = async (rentalId: number) => {
    setPendingId(rentalId);
    setActionError(null);
    try {
      await returnHardware(rentalId);
      await refresh();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Nazwa" },
    { key: "brand", label: "Marka" },
    { key: "purchase_date", label: "Data zakupu" },
    { key: "status", label: "Status" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sprzęt firmowy</h1>
          <p className="mt-1 text-sm text-slate-500">
            Przeglądaj dostępny sprzęt, filtruj i wypożyczaj to, czego
            potrzebujesz.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={brandFilterInput}
            onChange={(e) => setBrandFilterInput(e.target.value)}
            placeholder="Filtruj po marce..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as HardwareStatus | "")
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-sm text-rose-600">
            {error}
          </div>
        ) : sortedHardware.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Brak sprzętu spełniającego kryteria.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none px-4 py-3 text-left font-semibold text-slate-600 hover:text-indigo-600"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHardware.map((item) => {
                const myRental = activeRentalByHardwareId.get(item.id);
                const isPending =
                  pendingId === item.id ||
                  (myRental !== undefined && pendingId === myRental.id);
                return (
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
                    <td className="px-4 py-3 text-right">
                      {item.status === "available" && (
                        <button
                          type="button"
                          onClick={() => handleRent(item.id)}
                          disabled={isPending}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {isPending ? "..." : "Wypożycz"}
                        </button>
                      )}
                      {myRental && (
                        <button
                          type="button"
                          onClick={() => handleReturn(myRental.id)}
                          disabled={isPending}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {isPending ? "..." : "Zwróć"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
