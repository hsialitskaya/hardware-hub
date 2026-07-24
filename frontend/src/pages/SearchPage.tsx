import { useState } from "react";
import type { FormEvent } from "react";
import { semanticSearch } from "../api/search";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner } from "../components/Spinner";
import { extractErrorMessage } from "../utils/errors";
import type { SearchResult } from "../types";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [usedAi, setUsedAi] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await semanticSearch(query.trim());
      setResults(response.results);
      setUsedAi(response.used_ai);
      setHasSearched(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Wyszukiwarka AI</h1>
      <p className="mt-1 text-sm text-slate-500">
        Opisz, czego potrzebujesz, np. „coś do testowania aplikacji na
        Androida”.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Czego szukasz?"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
        >
          {isLoading ? "Szukam..." : "Szukaj"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      )}

      {!isLoading && hasSearched && (
        <div className="mt-6">
          {usedAi !== null && (
            <p className="mb-4 text-xs font-medium text-slate-400">
              {usedAi
                ? "✨ Wyniki wygenerowane przez AI"
                : "🔍 Wyniki z prostego wyszukiwania słów kluczowych (AI niedostępne)"}
            </p>
          )}

          {results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
              Nie znaleziono pasującego sprzętu.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(({ hardware, reason }) => (
                <div
                  key={hardware.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {hardware.name}
                      </h3>
                      <p className="text-sm text-slate-500">{hardware.brand}</p>
                    </div>
                    <StatusBadge status={hardware.status} />
                  </div>
                  {reason && (
                    <p className="mt-3 text-sm text-slate-600">{reason}</p>
                  )}
                  {hardware.notes && (
                    <p className="mt-3 text-xs text-slate-400">
                      {hardware.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
