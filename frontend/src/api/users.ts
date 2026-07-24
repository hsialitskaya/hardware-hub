import { apiClient } from "./client";
import type { User, UserRole } from "../types";

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
}

export async function listUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>("/users");
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
