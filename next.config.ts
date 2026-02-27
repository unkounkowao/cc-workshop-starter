import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/cc-workshop-starter',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
