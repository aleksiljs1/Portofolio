import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'bcryptjs', '@prisma/adapter-pg', '@prisma/client'],
  allowedDevOrigins: ['100.64.132.90'],
};

export default nextConfig;
