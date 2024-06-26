/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    {
      source: "/",
      destination: "/login",
      permanent: true,
    },
  ],
  images: {
    remotePatterns: [
      {
        hostname: "anytwitter.blob.core.windows.net",
        pathname: "/anytwitter/images/*",
        port: "",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
