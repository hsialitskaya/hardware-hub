import { useState } from "react";
import type { FormEvent } from "react";
import type { UserRole } from "../types";
import type { CreateUserInput } from "../api/users";
import { PasswordInput } from "./PasswordInput";
import { extractErrorMessage } from "../utils/errors";
import { MAX_LENGTH } from "../utils/validation";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserInput) => Promise<void>;
}

export function UserFormModal({ open, onClose, onSubmit }: UserFormModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setEmail("");
    setPassword("");
    setRole("user");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const COMPANY_DOMAIN = "@booksy.com";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!email.trim().toLowerCase().endsWith(COMPANY_DOMAIN)) {
      setError(
        `Only company emails ending with ${COMPANY_DOMAIN} are allowed.`,
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({ email, password, role });
      reset();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">
          Create New Account
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Accounts must use the company domain (@booksy.com).
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={MAX_LENGTH.EMAIL}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              minLength={6}
              maxLength={MAX_LENGTH.PASSWORD}
              required
              className="mt-1"
              inputClassName="rounded-lg px-3 py-2 text-sm"
              buttonClassName="right-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>

            <div className="relative mt-1">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="appearance-none w-full rounded-lg border border-gray-300 px-3 pr-10 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
