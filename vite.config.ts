import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs/promises";
import { componentTagger } from "lovable-tagger";

// Generate sitemap.xml at build time by fetching from Supabase Edge Function
const generateSitemapPlugin = (): Plugin => {
  return {
    name: "generate-sitemap",
    apply: "build" as const,
    async closeBundle() {
      const url = "https://imwastdmyeaaslurcovw.supabase.co/functions/v1/sitemap";
      try {
        const res = await fetch(url, { headers: { Accept: "application/xml, text/xml, */*" } });
        if (!res.ok) throw new Error(`Supabase function returned ${res.status}: ${res.statusText}`);
        const xml = await res.text();
        if (!xml.trim().startsWith("<?xml")) throw new Error("Invalid XML received");
        await fs.writeFile(path.resolve(__dirname, "dist", "sitemap.xml"), xml, "utf8");
        console.log("[sitemap] Generated sitemap.xml from Supabase Edge Function");
      } catch (err) {
        console.warn("[sitemap] Failed to generate from Edge Function, writing fallback:", err);
        const nowIso = new Date().toISOString();
        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://myecclesia.co.uk/</loc><lastmod>${nowIso}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://myecclesia.co.uk/events</loc><lastmod>${nowIso}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://myecclesia.co.uk/about</loc><lastmod>${nowIso}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>https://myecclesia.co.uk/contact</loc><lastmod>${nowIso}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://myecclesia.co.uk/donate</loc><lastmod>${nowIso}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://myecclesia.co.uk/calendar</loc><lastmod>${nowIso}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://myecclesia.co.uk/blog</loc><lastmod>${nowIso}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
</urlset>`;
        await fs.writeFile(path.resolve(__dirname, "dist", "sitemap.xml"), fallback, "utf8");
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && generateSitemapPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
