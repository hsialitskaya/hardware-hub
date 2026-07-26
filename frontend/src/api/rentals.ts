import { apiClient } from "./client";
import type { Rental } from "../types";

export interface PaginatedRentals {
  items: Rental[];
  total: number;
  page: number;
  page_size: number;
}

export async function rentHardware(hardwareId: number): Promise<Rental> {
  const { data } = await apiClient.post<Rental>("/rentals", {
    hardware_id: hardwareId,
  });
  return data;
}

export async function returnHardware(rentalId: number): Promise<Rental> {
  const { data } = await apiClient.post<Rental>(`/rentals/${rentalId}/return`);
  return data;
}

export interface MyRentalsFilters {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_direction?: "asc" | "desc";
}

export async function myRentals(
  filters: MyRentalsFilters = {},
): Promise<PaginatedRentals> {
  const params: Record<string, string> = {};
  if (filters.page) params.page = String(filters.page);
  if (filters.page_size) params.page_size = String(filters.page_size);
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_direction) params.sort_direction = filters.sort_direction;

  const { data } = await apiClient.get<PaginatedRentals>("/rentals/me", {
    params,
  });
  return data;
}
