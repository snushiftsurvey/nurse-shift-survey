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

  // PDF 생성을 위한 정적 파일 CORS 설정
  async headers() {
    return [
      {
        // 이미지 파일에 CORS 헤더 추가
        source: '/images/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;