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
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/control-room',
        permanent: false,
      },
      {
        source: '/admin/',
        destination: '/admin/control-room',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig 