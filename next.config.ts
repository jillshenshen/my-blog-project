import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  experimental: {
    // Next 16 proxy（前身 middleware）預設只放行 10MB body，相簿多檔上傳需要更大
    proxyClientMaxBodySize: "60mb",
    serverActions: {
      // 單檔仍限 10MB（在 action 內驗證），但相簿多檔批次上傳時 multipart body 會更大
      bodySizeLimit: "60mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
