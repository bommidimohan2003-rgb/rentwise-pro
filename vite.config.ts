import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  ssr: {
    noExternal: ["firebase", "@firebase/app", "@firebase/auth"],
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth"],
  },
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_URL || "https://payent-backend.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      // Remove COOP restriction so Google Sign-In popup can call window.close/closed on opener
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  plugins: [
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    nitro(),
    tailwindcss(),
    react(),
  ],
});
