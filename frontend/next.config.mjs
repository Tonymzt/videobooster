/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // Permitir todo para MVP, ajustar luego
    ],
  },
  // Aumentar timeouts para Server Actions si es necesario, 
  // aunque con webhooks ya no es crítico.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
