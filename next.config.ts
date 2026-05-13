import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'bcryptjs', '@prisma/adapter-pg', '@prisma/client'],
};

export default nextConfig;
