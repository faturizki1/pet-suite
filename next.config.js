/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_MINIO_HOSTNAME || 'minio.domainanda.com',
        pathname: '/clinic-uploads/**'
      }
    ]
  },
  typescript: { tsconfigPath: './tsconfig.json' },
  eslint: { ignoreDuringBuilds: false }
}

module.exports = nextConfig
