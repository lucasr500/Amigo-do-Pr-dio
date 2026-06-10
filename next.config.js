/** @type {import('next').NextConfig} */
const path = require("path");

// Headers de segurança aplicados a todas as rotas.
// Redundantes com vercel.json em produção Vercel, mas necessários para
// desenvolvimento local (npm run dev) e deploys alternativos.
const SECURITY_HEADERS = [
  // Impede que a página seja carregada em iframes de outras origens (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Impede sniffing de MIME type pelo navegador.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Envia apenas a origem no Referer ao navegar para outros sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restringe permissões de hardware — sem câmera, microfone ou geolocalização.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // CSP parcial: bloqueia injeção via <base> e plugins Flash/Java.
  // Não cobre script-src (quebra Next.js inline scripts) — evolução gradual.
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
  webpack: (config) => {
    // Workaround: next-app-loader.js (legacy flat file) takes priority over
    // next-app-loader/index.js in Node module resolution, but the flat file
    // passes VAR_ORIGINAL_PATHNAME to templates that no longer have this
    // placeholder in Next.js 15.5.18, causing an invariant build error.
    // Force webpack to use the correct refactored loader directly.
    config.resolveLoader.alias["next-app-loader"] = path.resolve(
      __dirname,
      "node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js"
    );
    return config;
  },
};

module.exports = nextConfig;
