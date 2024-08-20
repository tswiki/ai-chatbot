/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ['https://ai-chatbot-v1.vercel.app','http://localhost:3000', 'http://revitalise.io'],
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
