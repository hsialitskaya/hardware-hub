import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { listHardware } from "../api/hardware";
import { myRentals, rentHardware, returnHardware } from "../api/rentals";
import { semanticSearch } from "../api/search";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import { extractErrorMessage } from "../utils/errors";
import { MAX_LENGTH } from "../utils/validation";
import type { Hardware, HardwareStatus, Rental, SearchResult } from "../types";

type SortKey = "name" | "brand" | "purchase_date" | "status";
type SortDirection = "asc" | "desc";

const STATUS_FILTERS: { value: HardwareStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "repair", label: "Repair" },
];

function SparklesIcon({ className }: { className?: string }) {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const hw = await listHardware({
          status: statusFilter,
          brand: brandFilter,
        });
        let activeRentals: Rental[] = [];

        // Only load rentals for non-admin users
        if (user?.role !== "admin") {
          activeRentals = await myRentals();
        }

        if (!cancelled) {
          setHardware(hw);
          setRentals(activeRentals);
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
  }, [statusFilter, brandFilter, user]);

  const refresh = async () => {
    const hw = await listHardware({ status: statusFilter, brand: brandFilter });
    let activeRentals: Rental[] = [];

    // Only load rentals for non-admin users
    if (user?.role !== "admin") {
      activeRentals = await myRentals();
    }

    setHardware(hw);
    setRentals(activeRentals);
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

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await semanticSearch(searchQuery.trim());
      setSearchResults(response.results);
      setHasSearched(true);
    } catch (err) {
      setSearchError(extractErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Hardware List</h1>
      </div>

      {/* Search Section - Only for non-admin users */}
      {user?.role !== "admin" && (
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon className="h-5 w-5" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask AI..."
              maxLength={MAX_LENGTH.SEARCH_QUERY}
              className="w-full rounded-xl border-0 bg-gray-100 py-3.5 pl-12 pr-12 text-base text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
            />
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-purple-500">
              <SparklesIcon className="h-5 w-5" />
            </div>
          </form>

          {searchError && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {searchError}
            </div>
          )}

          {isSearching && (
            <div className="mt-10 flex justify-center">
              <Spinner />
            </div>
          )}

          {!isSearching && hasSearched && (
            <div className="mt-6">
              {searchResults.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  No matching hardware found.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map(({ hardware: item, reason }) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600">{item.brand}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      {reason && (
                        <p className="mt-3 text-xs text-gray-500">{reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={brandFilterInput}
          onChange={(e) => setBrandFilterInput(e.target.value)}
          placeholder="Filter by brand..."
          maxLength={MAX_LENGTH.BRAND_FILTER}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as HardwareStatus | "")
            }
            className="appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-sm text-gray-700">
            {error}
          </div>
        ) : sortedHardware.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No hardware matching the criteria.
          </div>
        ) : (
          <table className="min-w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-900">
                <th
                  onClick={() => toggleSort("name")}
                  className="cursor-pointer select-none px-6 py-4 font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    Device Name
                    {sortKey === "name" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("brand")}
                  className="cursor-pointer select-none px-6 py-4 font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    Brand
                    {sortKey === "brand" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("purchase_date")}
                  className="cursor-pointer select-none px-6 py-4 font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    Date Added
                    {sortKey === "purchase_date" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("status")}
                  className="cursor-pointer select-none px-6 py-4 font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    Status
                    {sortKey === "status" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedHardware.map((item, index) => {
                const myRental = activeRentalByHardwareId.get(item.id);
                const isPending =
                  pendingId === item.id ||
                  (myRental !== undefined && pendingId === myRental.id);
                return (
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
                    <td className="px-6 py-4 text-gray-700">
                      {item.purchase_date ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.role !== "admin" && (
                        <>
                          {item.status === "available" && (
                            <button
                              type="button"
                              onClick={() => handleRent(item.id)}
                              disabled={isPending}
                              className="rounded-xl bg-gray-950 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-900 disabled:opacity-60"
                            >
                              {isPending ? "..." : "Rent"}
                            </button>
                          )}
                          {myRental && (
                            <button
                              type="button"
                              onClick={() => handleReturn(myRental.id)}
                              disabled={isPending}
                              className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                            >
                              {isPending ? "..." : "Return"}
                            </button>
                          )}
                          {item.status !== "available" && !myRental && (
                            <span className="inline-block rounded-xl bg-gray-200 px-5 py-2 text-sm font-medium text-gray-500">
                              Rent
                            </span>
                          )}
                        </>
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
