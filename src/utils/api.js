const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://ai-jobs-posting-backend.vercel.app";

const buildUrl = (path = "") => {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export const apiFetch = async (path, options = {}) => {
  const config = { ...options };
  config.headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(buildUrl(path), config);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (payload.error || payload.message)) ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return payload;
};

export const apiFetchRaw = async (path, options = {}) => {
  const response = await fetch(buildUrl(path), options);
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || response.statusText);
  }
  return response;
};

export const API_BASE = API_BASE_URL;

