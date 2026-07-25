export type UserRole = "admin" | "user";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
}

export type HardwareStatus = "available" | "in_use" | "repair";

export interface Hardware {
  id: number;
  name: string;
  brand: string;
  serial_number: string | null;
  purchase_date: string | null;
  status: HardwareStatus;
  notes: string | null;
}

export interface HardwareInput {
  name: string;
  brand: string;
  serial_number: string | null;
  purchase_date: string | null;
  status: HardwareStatus;
  notes: string | null;
}

export interface Rental {
  id: number;
  hardware_id: number;
  user_id: number;
  rented_at: string;
  returned_at: string | null;
}

export interface SearchResult {
  hardware: Hardware;
  reason: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  used_ai: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
