import axios from "axios";

type ApiErrorBody = {
  message?: unknown;
  errors?: unknown;
};

/**
 * Ambil pesan error yang aman untuk ditampilkan dari response API Laravel.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const errors = error.response?.data?.errors;

    if (errors && typeof errors === "object") {
      const firstError = Object.values(errors)[0];

      if (Array.isArray(firstError) && typeof firstError[0] === "string") {
        return firstError[0];
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
