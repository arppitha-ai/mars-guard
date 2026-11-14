const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, "")
  : import.meta.env.DEV
    ? "http://127.0.0.1:5000"
    : "";
