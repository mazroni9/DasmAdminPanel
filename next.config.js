/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
    localeDetection: false
  },
  experimental: {
    optimizeFonts: true
  }
}

module.exports = nextConfig 