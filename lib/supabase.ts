import { createClient } from '@supabase/supabase-js'
import SupabaseAutoWake from './SupabaseAutoWake'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvxihkmmmfumuzewngbz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52eGloa21tbWZ1bXV6ZXduZ2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODIyNzUsImV4cCI6MjA3MTI1ODI3NX0.1jCRrikmidFIhnyv43SgX3r6wEyf4cP56DjcTp5sdRM'

// 🔐 싱글톤 패턴으로 클라이언트 중복 생성 방지
let supabaseInstance: any = null
let supabasePublicInstance: any = null

// 🔄 자동 깨우기 인스턴스들
let autoWakeInstance: SupabaseAutoWake | null = null
let autoWakePublicInstance: SupabaseAutoWake | null = null
let autoWakeAdminInstance: SupabaseAutoWake | null = null

// 🔐 관리자용 클라이언트 (세션 지속)
export const supabase = (() => {
  if (!supabaseInstance) {
    console.log('🔧 새 관리자용 Supabase 클라이언트 생성')
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // 관리자 로그인 세션 유지
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-client-info': 'nurse-shift-survey-admin'
        }
      }
    })

    // 🛡️ 유효하지 않은 토큰 감지 시 자동으로 세션 클리어
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('⚠️ 토큰 갱신 실패 - 세션 클리어')
        supabaseInstance.auth.signOut()
      }
    })

    // 🛡️ 초기 세션 검증
    if (typeof window !== 'undefined') {
      supabaseInstance.auth.getSession().catch((error: any) => {
        if (error?.message?.includes('Refresh Token')) {
          console.warn('⚠️ 유효하지 않은 Refresh Token 감지 - 세션 클리어')
          supabaseInstance.auth.signOut()
        }
      })
    }
  }
  return supabaseInstance
})()

// 🔄 관리자용 자동 깨우기 인스턴스
export const getAutoWake = (): SupabaseAutoWake => {
  if (!autoWakeInstance) {
    console.log(' 관리자용 AutoWake 인스턴스 생성')
    autoWakeInstance = new SupabaseAutoWake(supabaseUrl, supabaseAnonKey, {
      testTable: 'surveys', // 실제 존재하는 테이블 사용
      enableLogs: process.env.NODE_ENV === 'development',
      maxAttempts: 8,
      retryInterval: 3000,
      enableAutoRetry: true
    })
  }
  return autoWakeInstance
}

// 📝 설문 제출용 클라이언트 (세션 비지속)
export const supabasePublic = (() => {
  if (!supabasePublicInstance) {
    console.log('🔧 새 공개용 Supabase 클라이언트 생성')
    supabasePublicInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // 설문 제출 시 세션 문제 방지
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'x-client-info': 'nurse-shift-survey-public'
        }
      }
    })
  }
  return supabasePublicInstance
})()

// 🔄 공개용 자동 깨우기 인스턴스  
export const getAutoWakePublic = (): SupabaseAutoWake => {
  if (!autoWakePublicInstance) {
    console.log('🔧 공개용 AutoWake 인스턴스 생성')
    autoWakePublicInstance = new SupabaseAutoWake(supabaseUrl, supabaseAnonKey, {
      testTable: 'surveys',
      enableLogs: process.env.NODE_ENV === 'development',
      maxAttempts: 6,
      retryInterval: 3000,
      enableAutoRetry: true
    })
  }
  return autoWakePublicInstance
}

// 서버사이드용 클라이언트 (임시로 anon key 사용)  
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

// 🔄 서버사이드용 자동 깨우기 인스턴스
export const getAutoWakeAdmin = (): SupabaseAutoWake => {
  if (!autoWakeAdminInstance) {
    console.log('🔧 관리자용 AutoWake 인스턴스 생성')
    autoWakeAdminInstance = new SupabaseAutoWake(
      supabaseUrl, 
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
      {
        testTable: 'surveys',
        enableLogs: process.env.NODE_ENV === 'development',
        maxAttempts: 10,
        retryInterval: 2000,
        enableAutoRetry: true
      }
    )
  }
  return autoWakeAdminInstance
}

// 🔄 안전한 쿼리 실행을 위한 래퍼 함수들
export const safeQuery = {
  /**
   * 관리자용 안전한 쿼리 실행
   */
  admin: async <T>(queryFn: () => Promise<T>): Promise<T> => {
    return getAutoWake().safeQuery(queryFn, 2)
  },

  /**
   * 공개용 안전한 쿼리 실행  
   */
  public: async <T>(queryFn: () => Promise<T>): Promise<T> => {
    return getAutoWakePublic().safeQuery(queryFn, 1)
  },

  /**
   * 서버사이드용 안전한 쿼리 실행
   */
  server: async <T>(queryFn: () => Promise<T>): Promise<T> => {
    return getAutoWakeAdmin().safeQuery(queryFn, 2)
  }
}

// 🔄 연결 상태 확인 함수들
export const healthCheck = {
  /**
   * 관리자용 연결 상태 확인
   */
  admin: async () => getAutoWake().healthCheck(),

  /**
   * 공개용 연결 상태 확인
   */
  public: async () => getAutoWakePublic().healthCheck(),

  /**
   * 서버사이드용 연결 상태 확인
   */
  server: async () => getAutoWakeAdmin().healthCheck(),

  /**
   * 전체 연결 상태 확인
   */
  all: async () => {
    const [adminHealth, publicHealth, serverHealth] = await Promise.allSettled([
      healthCheck.admin(),
      healthCheck.public(),
      healthCheck.server()
    ])

    return {
      admin: adminHealth.status === 'fulfilled' ? adminHealth.value : { status: 'error', error: 'Health check failed' },
      public: publicHealth.status === 'fulfilled' ? publicHealth.value : { status: 'error', error: 'Health check failed' },
      server: serverHealth.status === 'fulfilled' ? serverHealth.value : { status: 'error', error: 'Health check failed' },
      timestamp: new Date().toISOString()
    }
  }
}

// 🔄 자동 깨우기 함수들
export const wakeUp = {
  /**
   * 관리자 DB 깨우기
   */
  admin: async () => getAutoWake().wakeUpDatabase(),

  /**
   * 공개 DB 깨우기
   */
  public: async () => getAutoWakePublic().wakeUpDatabase(),

  /**
   * 서버사이드 DB 깨우기  
   */
  server: async () => getAutoWakeAdmin().wakeUpDatabase(),

  /**
   * 모든 DB 깨우기
   */
  all: async () => {
    const results = await Promise.allSettled([
      wakeUp.admin(),
      wakeUp.public(), 
      wakeUp.server()
    ])

    return {
      admin: results[0].status === 'fulfilled' ? results[0].value : false,
      public: results[1].status === 'fulfilled' ? results[1].value : false,
      server: results[2].status === 'fulfilled' ? results[2].value : false,
      timestamp: new Date().toISOString()
    }
  }
}
