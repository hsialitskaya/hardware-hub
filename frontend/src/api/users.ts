import { apiClient } from "./client";
import type { User, UserRole } from "../types";

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

export async function listUsers(
  page: number = 1,
  pageSize: number = 10,
  sortBy?: string,
  sortDirection?: "asc" | "desc",
): Promise<PaginatedUsers> {
  const params: Record<string, string> = {
    page: String(page),
    page_size: String(pageSize),
  };
  if (sortBy) params.sort_by = sortBy;
  if (sortDirection) params.sort_direction = sortDirection;

  const { data } = await apiClient.get<PaginatedUsers>("/users", {
    params,
  });
  return data;
}

export async function createUser(payload: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<User>("/users", payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}
