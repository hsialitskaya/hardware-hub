import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Hardware, HardwareInput, HardwareStatus } from "../types";
import { extractErrorMessage } from "../utils/errors";
import { MAX_LENGTH } from "../utils/validation";

interface HardwareFormModalProps {
  open: boolean;
  initialValue?: Hardware | null;
  onClose: () => void;
  onSubmit: (payload: HardwareInput) => Promise<void>;
}

const STATUS_OPTIONS: { value: HardwareStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "repair", label: "Repair" },
];

function todayInputValue(): string {
  return new Date().toISOString().split("T")[0];
}

const EMPTY_FORM: HardwareInput = {
  name: "",
  brand: "",
  serial_number: "",
  purchase_date: todayInputValue(),
  status: "available",
  notes: "",
};

export function HardwareFormModal({
  open,
  initialValue,
  onClose,
  onSubmit,
}: HardwareFormModalProps) {
  const [form, setForm] = useState<HardwareInput>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        initialValue
          ? {
              name: initialValue.name,
              brand: initialValue.brand,
              serial_number: initialValue.serial_number ?? "",
              purchase_date: initialValue.purchase_date,
              status: initialValue.status,
              notes: initialValue.notes ?? "",
            }
          : EMPTY_FORM,
      );
      setError(null);
    }
  }, [open, initialValue]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">
          {initialValue ? "Edit Hardware" : "Add New Hardware"}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={MAX_LENGTH.HARDWARE_NAME}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Brand
            </label>
            <input
              required
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              maxLength={MAX_LENGTH.HARDWARE_BRAND}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Serial Number
            </label>
            <input
              value={form.serial_number ?? ""}
              onChange={(e) =>
                setForm({ ...form, serial_number: e.target.value || null })
              }
              maxLength={MAX_LENGTH.HARDWARE_SERIAL}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Purchase Date
              </label>
              <input
                type="date"
                value={form.purchase_date ?? ""}
                onChange={(e) =>
                  setForm({ ...form, purchase_date: e.target.value || null })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>

              <div
                className="relative mt-1"
                title={
                  initialValue?.status === "in_use"
                    ? "Status cannot be changed while the device is rented"
                    : undefined
                }
              >
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as HardwareStatus,
                    })
                  }
                  disabled={initialValue?.status === "in_use"}
                  className="appearance-none w-full rounded-lg border border-gray-300 px-3 pr-10 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={MAX_LENGTH.HARDWARE_NOTES}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
