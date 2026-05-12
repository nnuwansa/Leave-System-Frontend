import { API_BASE_URL } from "../config/config";

if (!API_BASE_URL) {
  console.error("❌ CRITICAL: API_BASE_URL is not defined!");
  console.error("Check your .env file and restart the dev server");
}

/**
 * Generic API call function with improved error handling
 */
export const apiCall = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error(
      "API_BASE_URL is not configured. Check your .env file and restart the server."
    );
  }

  let token = null;
  try {
    token = localStorage?.getItem("token");
  } catch (e) {
    console.warn("LocalStorage not available:", e);
  }

  const config = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
   

    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type");

    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      console.error(`❌ ${config.method} ${endpoint} - ${response.status}`);
      throw new Error(
        data?.message || data || `HTTP error! status: ${response.status}`
      );
    }

    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);

    // Provide helpful error messages
    if (
      error.message.includes("Failed to fetch") ||
      error.name === "TypeError"
    ) {
      throw new Error(
        `Cannot connect to API at ${API_BASE_URL}. Is the server running?`
      );
    }

    throw error;
  }
};

/**
 * API object with HTTP methods
 */
export const API = {
  get: (endpoint) => apiCall(endpoint, { method: "GET" }),

  post: (endpoint, data) =>
    apiCall(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: (endpoint, data) =>
    apiCall(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (endpoint) => apiCall(endpoint, { method: "DELETE" }),

  patch: (endpoint, data) =>
    apiCall(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export default API;
