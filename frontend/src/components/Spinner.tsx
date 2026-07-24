export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Ładowanie"
    />
  );
}
