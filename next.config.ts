import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode 비활성화 (개발환경 중복 실행 방지)
  reactStrictMode: false,
  
  // Supabase 캐시 문제 해결을 위한 설정 (최신 문법)
  serverExternalPackages: ['@supabase/supabase-js']
};

export default nextConfig;
