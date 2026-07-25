export function extractErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (
      err as { response?: { data?: { detail?: string | unknown } } }
    ).response;
    const detail = response?.data?.detail;
    if (detail) {
      return typeof detail === "string"
        ? detail
        : "Something went wrong. Please try again.";
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}
