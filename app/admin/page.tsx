'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {

      const emailFormat = credentials.username === 'admin' 
        ? 'admin@nurseshiftsurvey.local'  // admin → 특별 이메일
        : `${credentials.username}@nurseshiftsurvey.local`  // 기타 → 일반 변환

      
      // 실제 Supabase Auth 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFormat,
        password: credentials.password,
      })

      if (error) {
        console.error('❌ 로그인 실패:', error)
        
        // 사용자 친화적 에러 메시지
        if (error.message.includes('Invalid login credentials')) {
          alert('아이디 또는 비밀번호가 올바르지 않습니다.')
        } else {
          alert('로그인 실패: ' + error.message)
        }
        return
      }

      if (data.user) {

        router.push('/admin/dashboard')
      } else {
        alert('로그인에 실패했습니다.')
      }
      
    } catch (err) {
      console.error('💥 로그인 중 예외:', err)
      alert('로그인 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
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
