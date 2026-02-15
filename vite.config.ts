import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // Avoid unexpected reloads when switching tabs/camera on some browsers.
      // The app will only update when the user chooses to reload.
      registerType: "prompt",
      includeAssets: ["favicon.ico", "robots.txt", "pwa-icons/*.png"],
      manifest: {
        name: "Concip Brasil - Sistema ERP",
        short_name: "Concip ERP",
        description: "Sistema ERP completo para gestão de serviços, estoque, frota e equipes técnicas.",
        theme_color: "#1e4976",
        background_color: "#0a1929",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "maskable any"
          },
          {
            src: "/pwa-icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
