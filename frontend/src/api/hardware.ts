import { apiClient } from "./client";
import type { Hardware, HardwareInput, HardwareStatus } from "../types";

export interface HardwareFilters {
  status?: HardwareStatus | "";
  brand?: string;
  sort_by?: string;
}

export async function listHardware(
  filters: HardwareFilters = {},
): Promise<Hardware[]> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.brand) params.brand = filters.brand;
  if (filters.sort_by) params.sort_by = filters.sort_by;

  const { data } = await apiClient.get<Hardware[]>("/hardware", { params });
  return data;
}

export async function createHardware(
  payload: HardwareInput,
): Promise<Hardware> {
  const { data } = await apiClient.post<Hardware>("/hardware", payload);
  return data;
}

export async function updateHardware(
  id: number,
  payload: Partial<HardwareInput>,
): Promise<Hardware> {
  const { data } = await apiClient.patch<Hardware>(`/hardware/${id}`, payload);
  return data;
}

export async function deleteHardware(id: number): Promise<void> {
  await apiClient.delete(`/hardware/${id}`);
}
