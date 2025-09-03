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
      },
      // Current Supabase instance
      {
        protocol: 'https',
        hostname: 'xiixxcwgeiwzkkwmzfni.supabase.co',
        port: '',
        pathname: '/**',
      },
      // Google User Content (for avatars from Google OAuth)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Additional configurations for better performance
  poweredByHeader: false,
};

export default nextConfig;
