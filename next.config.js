/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  // Usa este projeto como raiz (evita aviso de múltiplos lockfiles)
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/logo.png" }];
  },
};

module.exports = nextConfig;
