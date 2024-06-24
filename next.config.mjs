/** @type {import('next').NextConfig} */
const nextConfig = { redirects: async () => [{
    source: '/',
    destination: '/login',
    permanent: true,
}]};

export default nextConfig;
