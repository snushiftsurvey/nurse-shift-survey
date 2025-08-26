import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode 비활성화 (개발환경 중복 실행 방지)
  reactStrictMode: false,

  // Supabase 캐시 문제 해결을 위한 설정
  serverExternalPackages: ['@supabase/supabase-js'],

  // ESLint 에러가 있어도 빌드 강행
  eslint: {
    ignoreDuringBuilds: true,
  },

  // (선택) TS 타입 에러 무시하고 빌드 강행
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;