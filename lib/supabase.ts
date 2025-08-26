import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvxihkmmmfumuzewngbz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52eGloa21tbWZ1bXV6ZXduZ2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODIyNzUsImV4cCI6MjA3MTI1ODI3NX0.1jCRrikmidFIhnyv43SgX3r6wEyf4cP56DjcTp5sdRM'

// 🔐 관리자용 클라이언트 (세션 지속)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // 관리자 로그인 세션 유지
  },
  global: {
    headers: {
      'x-client-info': 'nurse-shift-survey-admin'
    }
  }
})

// 📝 설문 제출용 클라이언트 (세션 비지속)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 설문 제출 시 세션 문제 방지
  },
  global: {
    headers: {
      'x-client-info': 'nurse-shift-survey-public'
    }
  }
})

// 서버사이드용 클라이언트 (임시로 anon key 사용)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
)
