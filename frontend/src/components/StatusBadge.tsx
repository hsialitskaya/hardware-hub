import type { HardwareStatus } from "../types";

const STATUS_CONFIG: Record<
  HardwareStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Available",
    className: "bg-gray-950 text-white",
  },
  in_use: {
    label: "Rented",
    className: "bg-gray-200 text-gray-700",
  },
  repair: {
    label: "In Repair",
    className: "bg-rose-500 text-white",
  },
};

export function StatusBadge({ status }: { status: HardwareStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
