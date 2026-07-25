import { apiClient } from "./client";
import type { SearchResponse } from "../types";

export interface PaginatedSearchResponse extends SearchResponse {
  total: number;
  page: number;
  page_size: number;
}

export async function semanticSearch(
  query: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedSearchResponse> {
  const { data } = await apiClient.post<PaginatedSearchResponse>("/search", {
    query,
    page,
    page_size: pageSize,
  });
  return data;
}
