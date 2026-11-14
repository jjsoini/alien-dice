import { defineConfig, Plugin } from "vite";
// @ts-ignore
import { resolve } from "path";
// @ts-ignore
import fs from "fs";
import react from "@vitejs/plugin-react";

declare var __dirname: string;

/**
 * Serve a modified manifest in dev so the local version is distinguishable
 * from the published one when both are installed in Owlbear Rodeo.
 */
function localManifest(): Plugin {
  return {
    name: "local-manifest",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/manifest.json") return next();
        const manifest = JSON.parse(
          fs.readFileSync(resolve(__dirname, "public/manifest.json"), "utf-8")
        );
        manifest.name = manifest.name + " (local)";
        manifest.action.title = manifest.action.title + " (local)";
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.end(JSON.stringify(manifest));
      });
    },
  };
}

/**
 * Vite serves its prebundled dependencies as cacheable forever. Their version
 * tags can survive a rebuild, so a browser can mix cached files from an older
 * build with new ones and end up with two copies of a library (two physics
 * engines, only one of them started). Make the browser revalidate instead.
 */
function noForeverCache(): Plugin {
  return {
    name: "no-forever-cache",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        const setHeader = res.setHeader.bind(res);
        res.setHeader = ((name: string, value: string | number | string[]) =>
          setHeader(
            name,
            name.toLowerCase() === "cache-control" ? "no-cache" : value
          )) as typeof res.setHeader;
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 7513,
    strictPort: true,
    // Allow an HTTPS tunnel (`cloudflared tunnel --url http://localhost:7513`)
    // for testing in OBR on a phone
    allowedHosts: [".trycloudflare.com"],
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [react(), localManifest(), noForeverCache()],
  assetsInclude: ["**/*.glb", "**/*.hdr"],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        popover: resolve(__dirname, "popover.html"),
        background: resolve(__dirname, "background.html"),
      },
    },
  },
});
