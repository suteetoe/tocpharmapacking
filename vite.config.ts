/// <reference types="vitest" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";

// import { defineConfig } from 'vitest/config'
import vue from "@vitejs/plugin-vue";
import VueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("Base URL : ", env.VITE_APP_BASE_URL);

  return {
    plugins: [vue(), VueDevTools()],
    // test: {
    //   globals: true,
    //   environment: 'jsdom',
    //   coverage: {
    //     provider: 'v8',
    //     reporter: ['text', 'json', 'html'],
    //   },
    // },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    base: env.VITE_APP_BASE_URL || "/",
    server: {
      port: 8080,
    },
  };
});
