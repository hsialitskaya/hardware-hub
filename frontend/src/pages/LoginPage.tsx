import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { PasswordInput } from "../components/PasswordInput";
import { extractErrorMessage } from "../utils/errors";
import { MAX_LENGTH } from "../utils/validation";

const COMPANY_DOMAIN = "@booksy.com";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await login(email, password);
      const redirectPath =
        response.user.role === "admin" ? "/admin/hardware" : "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10">
        <div className="mb-8">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-1 text-base text-gray-500">
              Sign in to your account
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-gray-900">
              Email (company domain only)
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@booksy.com"
              maxLength={MAX_LENGTH.EMAIL}
              className="mt-2 w-full rounded-xl border-0 bg-gray-100 px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-900">
              Password
            </label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              maxLength={MAX_LENGTH.PASSWORD}
              required
              className="mt-2"
              inputClassName="border-0 bg-gray-100 focus:bg-white focus:ring-gray-200"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gray-950 px-4 py-3 text-base font-medium text-white transition hover:bg-gray-900 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
