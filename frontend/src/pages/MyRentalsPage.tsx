import { useEffect, useMemo, useState } from "react";
import { myRentals, returnHardware } from "../api/rentals";
import { listHardware } from "../api/hardware";
import { Spinner } from "../components/Spinner";
import { Pagination } from "../components/Pagination";
import { extractErrorMessage } from "../utils/errors";
import type { Hardware, Rental } from "../types";

type SortKey = "name" | "brand" | "rented_at" | "returned_at";
type SortDirection = "asc" | "desc";

export function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [hardwareById, setHardwareById] = useState<Map<number, Hardware>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [sortKey, setSortKey] = useState<SortKey>("rented_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadData = async (currentPage: number = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const [rentalList, hardwareList] = await Promise.all([
        myRentals(currentPage, pageSize),
        listHardware({ page_size: 100 }),
      ]);
      setRentals(rentalList.items);
      setTotalItems(rentalList.total);
      setPage(rentalList.page);
      setHardwareById(new Map(hardwareList.items.map((hw) => [hw.id, hw])));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData(1);
  }, []);

  const handleReturn = async (rentalId: number) => {
    setPendingId(rentalId);
    setError(null);
    try {
      await returnHardware(rentalId);
      await loadData(page);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  const handlePageChange = (nextPage: number) => {
    void loadData(nextPage);
  };

  const sortedRentals = useMemo(() => {
    const items = [...rentals];
    items.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      if (sortKey === "name" || sortKey === "brand") {
        const aHw = hardwareById.get(a.hardware_id);
        const bHw = hardwareById.get(b.hardware_id);
        aValue = (aHw?.[sortKey] ?? "") as string;
        bValue = (bHw?.[sortKey] ?? "") as string;
      } else {
        aValue = a[sortKey] ?? "";
        bValue = b[sortKey] ?? "";
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return items;
  }, [rentals, hardwareById, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Device Name" },
    { key: "brand", label: "Brand" },
    { key: "rented_at", label: "Rented" },
    { key: "returned_at", label: "Returned" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900">My Rentals</h1>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : rentals.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            You don't have any active rentals. Browse the hardware inventory to
            rent a device.
          </div>
        ) : (
          <table className="min-w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-900">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none px-6 py-4 font-semibold"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRentals.map((rental, index) => {
                const hw = hardwareById.get(rental.hardware_id);
                return (
                  <tr
                    key={rental.id}
                    className={`${
                      index % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                    } border-b border-gray-100 last:border-b-0 hover:bg-gray-50`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {hw?.name ?? `#${rental.hardware_id}`}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {hw?.brand ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(rental.rented_at).toLocaleString("en-US")}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {rental.returned_at ? (
                        new Date(rental.returned_at).toLocaleString("en-US")
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-950 px-3 py-1 text-xs font-medium text-white">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!rental.returned_at && (
                        <button
                          type="button"
                          onClick={() => handleReturn(rental.id)}
                          disabled={pendingId === rental.id}
                          className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                        >
                          {pendingId === rental.id ? "..." : "Return"}
                        </button>
                      )}
                      {rental.returned_at && (
                        <span className="inline-block rounded-xl bg-gray-200 px-5 py-2 text-sm font-medium text-gray-500">
                          Returned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && rentals.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
