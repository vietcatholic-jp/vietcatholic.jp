import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Development Supabase
      {
        protocol: 'https',
        hostname: 'nlnhhiasteknrfcfnzxd.supabase.co',
        port: '',
        pathname: '/**',
      },
      // Production Supabase
      {
        protocol: 'https',
        hostname: 'huwfbdggnbzklajkwcop.supabase.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
