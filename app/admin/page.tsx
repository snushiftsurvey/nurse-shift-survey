'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // 페이지 로드 시 Admin 세션만 정리 (설문 웹 데이터는 보존)
  useEffect(() => {
    const clearAdminSession = async () => {
      try {
        console.log('🧹 Admin 로그인 페이지 - Admin 세션만 정리 시작')
        
        // Admin 클라이언트의 세션 상태만 확인
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('⚠️ 기존 Admin 세션 발견 - 로그아웃 진행')
          // Admin 클라이언트에서만 로그아웃 (설문 웹 영향 없음)
          await supabase.auth.signOut()
        }
        
        console.log('✅ Admin 세션 정리 완료 (설문 웹 데이터 보존)')
      } catch (err) {
        console.warn('⚠️ Admin 세션 정리 중 오류 (무시 가능):', err)
      }
    }
    
    clearAdminSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      console.log('🔐 Admin 로그인 시도 시작')
      
      // Admin 세션 상태만 확인 및 정리 (설문 웹과 독립적)
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession) {
        console.log('⚠️ 로그인 전 기존 Admin 세션 발견 - 정리')
        await supabase.auth.signOut()
        
        // 잠시 대기 (Admin 세션 정리 완료 보장)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      const emailFormat = credentials.username === 'admin' 
        ? 'admin@nurseshiftsurvey.local'  // admin → 특별 이메일
        : `${credentials.username}@nurseshiftsurvey.local`  // 기타 → 일반 변환

      console.log('📧 로그인 시도:', emailFormat)

      // 실제 Supabase Auth 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFormat,
        password: credentials.password,
      })

      if (error) {
        console.error('❌ 로그인 실패:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // Admin 세션만 정리 (설문 웹 영향 없음)
        await supabase.auth.signOut()
        
        // 사용자 친화적 에러 메시지
        if (error.message.includes('Invalid login credentials')) {
          alert('아이디 또는 비밀번호가 올바르지 않습니다.')
        } else if (error.message.includes('refresh')) {
          alert('Admin 세션 문제가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.')
        } else {
          alert('로그인 실패: ' + error.message)
        }
        return
      }

      if (data.user && data.session) {
        console.log('✅ 로그인 성공:', data.user.id)
        console.log('🎫 새 세션 생성 완료')
        
        // 성공 시 대시보드로 이동
        router.push('/admin/dashboard')
      } else {
        console.error('❌ 로그인 응답 문제:', { user: !!data.user, session: !!data.session })
        alert('로그인에 실패했습니다.')
      }
      
    } catch (err) {
      console.error('💥 로그인 중 예외:', err)
      
      // 예외 발생 시에도 Admin 세션만 정리
      try {
        await supabase.auth.signOut()
      } catch (cleanupErr) {
        console.warn('Admin 세션 정리 중 오류:', cleanupErr)
      }
      
      alert('Admin 로그인 중 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 relative overflow-hidden">
        {/* 파랑색 책갈피 */}
        <div className="absolute top-0 left-0 w-16 h-16 md:w-20 md:h-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 transform rotate-45 -translate-x-8 -translate-y-8 md:-translate-x-10 md:-translate-y-10 shadow-lg"></div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            관리자 로그인
          </h1>
          <p className="text-gray-600">
            설문조사 관리 시스템
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관리자 아이디
            </label>
            <input
              type="text"
              required
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder=""
              autoComplete=""
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              placeholder=""
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed scale-95 opacity-75' 
                : 'hover:shadow-lg animate-pulse hover:animate-none'
            }`}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            🔐 관리자 계정으로 로그인
          </p>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
            <p className="font-medium">기본 계정:</p>
            <p>아이디: <span className="font-mono bg-white px-1 rounded">admin</span></p>
            <p>비밀번호: <span className="font-mono bg-white px-1 rounded">admin123!@#</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
