// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// });

// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },

  // Force fresh optimization every time
  optimizeDeps: {
    force: true,
  },

  // Clear the cache directory
  cacheDir: "node_modules/.vite",

  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
