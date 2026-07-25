export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
