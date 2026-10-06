import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["snarkjs", "@semaphore-protocol/proof"],
  images: {
    // Company logos come from whichever host each accelerator uses
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

};

export default nextConfig;
