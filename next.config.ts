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
        protocol: "http",
        hostname: "s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "http",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "images.crunchbase.com",
      },
      {
        protocol: "https",
        hostname: "launchrock-assets.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
    ],
  },
};

export default nextConfig;
