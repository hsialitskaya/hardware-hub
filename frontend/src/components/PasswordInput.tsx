import { useState } from "react";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  maxLength,
  minLength,
  required = false,
  className = "",
  inputClassName = "",
  buttonClassName = "",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-11 text-base text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 focus:outline-none ${inputClassName}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ${buttonClassName}`}
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOffIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
