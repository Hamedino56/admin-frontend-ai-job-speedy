const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://backend-job-speedy-ai-user-and-admi.vercel.app";

const buildUrl = (path = "") => {
  if (!path.startsWith("/")) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
  } catch {
    return null;
  }
};

export const apiFetch = async (path, options = {}) => {
  const config = { ...options };
  const token = getAuthToken();
  config.headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
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
  const token = getAuthToken();
  const config = {
    ...options,
    headers: {
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  };
  const response = await fetch(buildUrl(path), config);
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || response.statusText);
  }
  return response;
};

export const API_BASE = API_BASE_URL;

