import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["snarkjs", "@semaphore-protocol/proof"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "apimg.techstars.com",
      },
      {
        protocol: "http",
        hostname: "apimg.techstars.com",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
    ],
  },
};

export default nextConfig;
