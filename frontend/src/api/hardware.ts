import { apiClient } from "./client";
import type { Hardware, HardwareInput, HardwareStatus } from "../types";

export interface HardwareFilters {
  status?: HardwareStatus | "";
  brand?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedHardware {
  items: Hardware[];
  total: number;
  page: number;
  page_size: number;
}

export async function listHardware(
  filters: HardwareFilters = {},
): Promise<PaginatedHardware> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.brand) params.brand = filters.brand;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.page) params.page = String(filters.page);
  if (filters.page_size) params.page_size = String(filters.page_size);

  const { data } = await apiClient.get<PaginatedHardware>("/hardware", {
    params,
  });
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
