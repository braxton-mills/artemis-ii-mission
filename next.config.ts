import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@react-three/postprocessing", "postprocessing"],
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
