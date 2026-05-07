// import axios from "axios";
// import { API_BASE_URL } from "../config/config";

// if (!API_BASE_URL) {
//   console.error("❌ API_BASE_URL is not defined. Check your .env file.");
// }

// const API = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 50000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// API.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     console.log(
//       `📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`,
//     );
//     return config;
//   },
//   (error) => {
//     console.error("❌ Request error:", error);
//     return Promise.reject(error);
//   },
// );

// API.interceptors.response.use(
//   (response) => {
//     console.log(
//       `✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${
//         response.status
//       }`,
//     );
//     return response;
//   },
//   (error) => {
//     if (error.code === "ECONNABORTED") {
//       console.error(`⏱️ Request timeout: ${error.config.url}`);
//       console.error(`Timeout was set to: ${error.config.timeout}ms`);
//     } else if (error.response) {
//       console.error(
//         `❌ ${error.config.method.toUpperCase()} ${error.config.url} - ${
//           error.response.status
//         }`,
//       );
//       console.error("Response error:", error.response.data);
//     } else if (error.request) {
//       console.error("❌ No response received:", error.request);
//     } else {
//       console.error("❌ Error:", error.message);
//     }
//     return Promise.reject(error);
//   },
// );

// export default API;


import axios from "axios";
import { API_BASE_URL } from "../config/config";

if (!API_BASE_URL) {
  console.error("❌ API_BASE_URL is not defined. Check your .env file.");
}

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`
    );
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error(`⏱️ Request timeout: ${error.config.url}`);
      console.error(`Timeout was set to: ${error.config.timeout}ms`);
    } else if (error.response) {
      console.error(
        `❌ ${error.config.method.toUpperCase()} ${error.config.url} - ${error.response.status}`
      );
      console.error("Response error:", error.response.data);
    } else if (error.request) {
      console.error("❌ No response received:", error.request);
    } else {
      console.error("❌ Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;