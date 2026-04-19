/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sofifa.net" },
      { protocol: "https", hostname: "cdn.sofifa.com" },
      { protocol: "https", hostname: "www.futbin.com" },
      { protocol: "https", hostname: "**.futbin.com" },
    ],
  },
};

export default nextConfig;
