/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Ensures static HTML export
  reactStrictMode: true,
  // Optional: Add basePath if you plan to serve the API Hub from a sub-path
  // basePath: '/api-hub',
  // Optional: Configure images if you use next/image
  // images: {
  //   unoptimized: true, // Required for static export if using next/image
  // },
};

export default nextConfig;
