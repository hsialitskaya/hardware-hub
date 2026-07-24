export function extractErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { detail?: string } } })
      .response;
    if (response?.data?.detail) {
      return response.data.detail;
    }
  }
  return "Coś poszło nie tak. Spróbuj ponownie.";
}
