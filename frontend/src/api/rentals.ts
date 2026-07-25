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

export async function myRentals(
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedRentals> {
  const { data } = await apiClient.get<PaginatedRentals>("/rentals/me", {
    params: { page: String(page), page_size: String(pageSize) },
  });
  return data;
}
