import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function tatumMemwalBridgePlugin(): Plugin {
  return {
    name: "tatum-memwal-bridge-api",
    async configureServer(server) {
      // Imported here, after process.env is filled below, because the module reads its
      // server-only keys (MEMWAL_PRIVATE_KEY, ENOKI_API_KEY, TATUM_API_KEY) at load time.
      // @ts-expect-error runtime ESM server module
      const { handleTatumMemwalRequest } = await import("./server/tatumMemwalApi.mjs");
      // @ts-expect-error runtime ESM server module
      const { handleNamespaceSkillsRequest } = await import("./server/namespaceSkillsApi.mjs");
      server.middlewares.use(async (req, res, next) => {
        if ((req.url || "").startsWith("/api/ns/")) {
          const nsHandled = await handleNamespaceSkillsRequest(req, res);
          if (nsHandled) return;
        }
        const handled = await handleTatumMemwalRequest(req, res);
        if (!handled) {
          next();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Give the dev-server middleware every variable from .env files, including the
  // non-VITE_ secrets. They stay on the server: the client bundle only ever sees
  // VITE_ values, and src/lib reads those by name.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  return {
    plugins: [react(), tailwindcss(), tatumMemwalBridgePlugin()],
    server: {
      proxy: {
        "/relayer-dev": {
          target: "https://relayer.dev.memwal.ai",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/relayer-dev/, ""),
        },
        "/relayer-prod": {
          target: "https://relayer.memory.walrus.xyz",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/relayer-prod/, ""),
        },
        "/tatum-api": {
          target: "https://api.tatum.io",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tatum-api/, ""),
          // Same as server.mjs in production: the browser sends no key, the server adds it.
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const key = process.env.TATUM_API_KEY;
              if (key && !req.headers["x-api-key"]) proxyReq.setHeader("x-api-key", key);
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
    },
  };
});
