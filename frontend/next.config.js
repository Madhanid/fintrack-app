/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    // Ensure API_URL doesn't end with a slash to avoid double slashes
    const apiUrl = (process.env.API_URL || 'https://fintrack-app-cff9.onrender.com').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
