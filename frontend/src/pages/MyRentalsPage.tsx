import { useEffect, useState } from "react";
import { myRentals, returnHardware } from "../api/rentals";
import { listHardware } from "../api/hardware";
import { Spinner } from "../components/Spinner";
import { extractErrorMessage } from "../utils/errors";
import type { Hardware, Rental } from "../types";

export function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [hardwareById, setHardwareById] = useState<Map<number, Hardware>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rentalList, hardwareList] = await Promise.all([
        myRentals(),
        listHardware(),
      ]);
      setRentals(rentalList);
      setHardwareById(new Map(hardwareList.map((hw) => [hw.id, hw])));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleReturn = async (rentalId: number) => {
    setPendingId(rentalId);
    setError(null);
    try {
      await returnHardware(rentalId);
      await loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Moje wypożyczenia</h1>
      <p className="mt-1 text-sm text-slate-500">
        Historia oraz aktywne wypożyczenia sprzętu.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-sm text-rose-600">
            {error}
          </div>
        ) : rentals.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Nie masz jeszcze żadnych wypożyczeń.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Sprzęt
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Wypożyczono
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Zwrócono
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentals.map((rental) => {
                const hw = hardwareById.get(rental.hardware_id);
                return (
                  <tr key={rental.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {hw
                        ? `${hw.name} (${hw.brand})`
                        : `#${rental.hardware_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(rental.rented_at).toLocaleString("pl-PL")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {rental.returned_at
                        ? new Date(rental.returned_at).toLocaleString("pl-PL")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!rental.returned_at && (
                        <button
                          type="button"
                          onClick={() => handleReturn(rental.id)}
                          disabled={pendingId === rental.id}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {pendingId === rental.id ? "..." : "Zwróć"}
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
