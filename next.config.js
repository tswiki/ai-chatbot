/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ['ai-chatbot-v1.vercel.app','localhost:3000', 'revitalise.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  }
}
