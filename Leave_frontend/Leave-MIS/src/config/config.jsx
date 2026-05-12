const currentEnv = import.meta.env.VITE_CURRENT_ENV || "development";

const config = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL_DEV,
    APP_ENV: "development",
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL_PROD,
    APP_ENV: "production",
  },
  staging: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL_STAGING || "",
    APP_ENV: "staging",
  },
};

const currentConfig = config[currentEnv] || config.development;

// Enhanced validation
if (!currentConfig.API_BASE_URL) {
  console.error(`❌ API_BASE_URL is missing for environment: ${currentEnv}`);
  console.error("Available environments:", Object.keys(config));
  console.error("Environment variables loaded:", {
    VITE_CURRENT_ENV: import.meta.env.VITE_CURRENT_ENV,
    VITE_API_BASE_URL_DEV: import.meta.env.VITE_API_BASE_URL_DEV,
    VITE_API_BASE_URL_PROD: import.meta.env.VITE_API_BASE_URL_PROD,
  });
} else {
  
}

// Named exports
export const API_BASE_URL = currentConfig.API_BASE_URL;
export const APP_ENV = currentConfig.APP_ENV;

// Default export
export default currentConfig;
