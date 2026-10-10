import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.us-east-005.backblazeb2.com",
      },
      { 
        protocol: "https", 
        hostname: "res.hbpzp.com.cn" 
      },
    ],
  },
};

export default nextConfig;
