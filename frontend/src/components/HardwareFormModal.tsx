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

const EMPTY_FORM: HardwareInput = {
  name: "",
  brand: "",
  serial_number: "",
  purchase_date: null,
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
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as HardwareStatus,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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

          {error && <p className="text-sm text-gray-700">{error}</p>}

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
