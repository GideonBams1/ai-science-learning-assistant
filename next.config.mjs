/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
      },
    ],
  },
  // Mermaid uses browser APIs — tell webpack to ignore it server-side
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "mermaid"];
    }
    return config;
  },
};

export default nextConfig;
