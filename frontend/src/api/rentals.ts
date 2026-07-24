import { apiClient } from "./client";
import type { Rental } from "../types";

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

export async function myRentals(): Promise<Rental[]> {
  const { data } = await apiClient.get<Rental[]>("/rentals/me");
  return data;
}
