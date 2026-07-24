import { apiClient } from "./client";
import type { SearchResponse } from "../types";

export async function semanticSearch(query: string): Promise<SearchResponse> {
  const { data } = await apiClient.post<SearchResponse>("/search", { query });
  return data;
}
