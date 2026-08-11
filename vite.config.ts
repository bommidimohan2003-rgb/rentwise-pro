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
  plugins: [
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    nitro(),
    tailwindcss(),
    react(),
  ],
});
