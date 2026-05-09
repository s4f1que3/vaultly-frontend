/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Allow HMR WebSocket connections from any local network IP in development
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['*'],
  }),
};

export default nextConfig;
