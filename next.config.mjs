/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images served locally + remote brand assets.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
