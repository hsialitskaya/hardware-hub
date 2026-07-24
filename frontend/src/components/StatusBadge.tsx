import type { HardwareStatus } from "../types";

const STATUS_CONFIG: Record<
  HardwareStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Dostępny",
    className: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  },
  in_use: {
    label: "W użyciu",
    className: "bg-sky-100 text-sky-700 ring-sky-600/20",
  },
  repair: {
    label: "Naprawa",
    className: "bg-amber-100 text-amber-700 ring-amber-600/20",
  },
};

export function StatusBadge({ status }: { status: HardwareStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  );
}
