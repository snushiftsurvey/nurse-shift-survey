'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SupabaseHealthCheck from '@/components/admin/SupabaseHealthCheck'
import ErrorLogViewer from '@/components/admin/ErrorLogViewer'
import { 
  Settings, 
  Globe, 
  Home, 
  Server, 
  Shield, 
  ClipboardList, 
  Link as LinkIcon, 
  BarChart3, 
  Wrench, 
  Rocket,
  Trash2,
  Cog,
  RefreshCw,
  FileText,
  Monitor,
  Database,
  Activity,
  Terminal,
  Copy,
  ExternalLink,
  GitCompare
} from 'lucide-react'

export default function AdminDevPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  // 🔐 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ 세션 확인 오류:', sessionError)
          setIsAuthenticated(false)
          return
        }

        if (!session) {
          console.warn('⚠️ 세션이 없습니다.')
          setIsAuthenticated(false)
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('❌ 사용자 정보 확인 실패:', userError)
          setIsAuthenticated(false)
          return
        }

        console.log('✅ 개발자 페이지 인증 성공:', user.email)
        setCurrentUser(user)
        setIsAuthenticated(true)
        
      } catch (err) {
        console.error('💥 인증 확인 중 예외:', err)
        setIsAuthenticated(false)
      } finally {
        setAuthLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // 🔄 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">개발자 인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 🔐 인증되지 않은 경우 차단
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">개발자 전용 영역</h1>
          <p className="text-gray-300 mb-4">관리자 로그인이 필요합니다.</p>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/admin')}
              className="block mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2"
            >
              관리자 로그인
            </button>
            <button 
              onClick={() => router.push('/admin/dashboard')}
              className="block mx-auto px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              일반 대시보드로 이동
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent flex items-center">
                <Settings className="w-6 h-6 mr-2 text-green-400" />
                DEVELOPER DASHBOARD
              </h1>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                DEV MODE
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-gray-300 text-sm flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                {currentUser?.email}
              </span>
              <Link
                href="/admin/dashboard"
                className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md text-sm hover:bg-gray-600 transition-colors"
              >
                일반 대시보드
              </Link>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut()
                    setIsAuthenticated(false)
                    setCurrentUser(null)
                    router.push('/admin')
                  } catch (err) {
                    console.error('로그아웃 실패:', err)
                    router.push('/admin')
                  }
                }}
                className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-6 py-6">
        {/* 페이지 이동 버튼들 */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-blue-400" />
            페이지 이동
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 로컬 설문 페이지 */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2 flex items-center">
                <Home className="w-4 h-4 mr-1.5" />
                로컬 환경
              </h4>
              <div className="space-y-2">
                <a
                  href="http://localhost:3006"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center"
                >
                  로컬 설문 페이지
                </a>
                <a
                  href="http://localhost:3006/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center"
                >
                  로컬 관리자 페이지
                </a>
              </div>
            </div>

            {/* 실제 서버 - 설문 페이지 */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                <Server className="w-4 h-4 mr-1.5" />
                실제 서버 - 설문
              </h4>
              <div className="space-y-2">
                <a
                  href="https://nurse-shift-survey.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center"
                >
                  <ClipboardList className="w-4 h-4 mr-1.5" />
                  실제 설문 페이지
                </a>
                <div className="text-xs text-gray-400 text-center">
                  nurse-shift-survey.vercel.app
                </div>
              </div>
            </div>

            {/* 실제 서버 - 관리자 페이지 */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-1.5" />
                실제 서버 - 관리자
              </h4>
              <div className="space-y-2">
                <a
                  href="https://nurse-shift-survey.vercel.app/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center"
                >
                  <Settings className="w-4 h-4 mr-1.5" />
                  실제 관리자 페이지
                </a>
                <div className="text-xs text-gray-400 text-center">
                  admin / admin123!@#
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 링크 섹션 */}
          <div className="mt-6 pt-4 border-t border-gray-600">
            <h4 className="text-white font-medium mb-3 flex items-center">
              <LinkIcon className="w-4 h-4 mr-1.5" />
              빠른 링크
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const urls = [
                    'http://localhost:3006',
                    'https://nurse-shift-survey.vercel.app/'
                  ]
                  urls.forEach(url => window.open(url, '_blank'))
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center"
              >
                <GitCompare className="w-3 h-3 mr-1" />
                설문 페이지 비교
              </button>
              <button
                onClick={() => {
                  const urls = [
                    'http://localhost:3006/admin',
                    'https://nurse-shift-survey.vercel.app/admin'
                  ]
                  urls.forEach(url => window.open(url, '_blank'))
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center"
              >
                <Settings className="w-3 h-3 mr-1" />
                관리자 페이지 비교
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://nurse-shift-survey.vercel.app/')
                  alert('실제 서버 URL이 클립보드에 복사되었습니다!')
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center"
              >
                <Copy className="w-3 h-3 mr-1" />
                URL 복사
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">
              <Wrench className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">개발자 도구</h2>
              <p className="text-gray-400">시스템 모니터링 및 디버깅 도구</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-green-400 font-medium flex items-center">
                <RefreshCw className="w-4 h-4 mr-1.5" />
                연결 모니터
              </div>
              <div className="text-gray-300">Supabase 연결 상태 실시간 확인</div>
            </div>
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-blue-400 font-medium flex items-center">
                <FileText className="w-4 h-4 mr-1.5" />
                로그 뷰어
              </div>
              <div className="text-gray-300">에러 및 시스템 로그 모니터링</div>
            </div>
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-purple-400 font-medium flex items-center">
                <Activity className="w-4 h-4 mr-1.5" />
                성능 분석
              </div>
              <div className="text-gray-300">응답 시간 및 성능 메트릭</div>
            </div>
          </div>
        </div>

        {/* Supabase 연결상태 모니터 */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Supabase 연결 상태 모니터
            </h3>
            <p className="text-gray-400 text-sm">데이터베이스 연결 상태 및 자동 깨우기 기능</p>
          </div>
          <SupabaseHealthCheck />
        </div>

        {/* 웹 로그 모니터 */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              시스템 로그 모니터
            </h3>
            <p className="text-gray-400 text-sm">실시간 에러 로그 및 시스템 이벤트 추적</p>
          </div>
          <ErrorLogViewer />
        </div>

        {/* 시스템 정보 */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Cog className="w-5 h-5 mr-2" />
            시스템 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-gray-400">환경</div>
              <div className="text-white font-medium">
                {process.env.NODE_ENV || 'development'}
              </div>
            </div>
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-gray-400">빌드 시간</div>
              <div className="text-white font-medium">
                {new Date().toLocaleString('ko-KR')}
              </div>
            </div>
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-gray-400">사용자 에이전트</div>
              <div className="text-white font-medium text-xs">
                {typeof window !== 'undefined' ? 
                  window.navigator.userAgent.split(' ')[0] : 'Unknown'}
              </div>
            </div>
            <div className="bg-gray-700/50 p-3 rounded">
              <div className="text-gray-400">현재 URL</div>
              <div className="text-white font-medium text-xs">
                {typeof window !== 'undefined' ? window.location.pathname : '/admin/dev'}
              </div>
            </div>
          </div>
        </div>

        {/* 개발자 액션 */}
        <div className="mt-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Rocket className="w-5 h-5 mr-2" />
            개발자 액션
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.clear()
                  sessionStorage.clear()
                  alert('브라우저 캐시가 클리어되었습니다.')
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              캐시 클리어
            </button>
            <button
              onClick={() => {
                console.log('=== 시스템 상태 덤프 ===')
                console.log('현재 시간:', new Date().toISOString())
                console.log('사용자:', currentUser)
                console.log('로컬 스토리지:', Object.keys(localStorage))
                console.log('세션 스토리지:', Object.keys(sessionStorage))
                alert('콘솔에 시스템 상태가 출력되었습니다.')
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Terminal className="w-4 h-4 mr-1.5" />
              상태 덤프
            </button>
            <button
              onClick={() => {
                const newWindow = window.open('', '_blank')
                if (newWindow) {
                  newWindow.document.write(`
                    <html>
                      <head><title>시스템 정보</title></head>
                      <body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00;">
                        <h2>시스템 정보</h2>
                        <pre>${JSON.stringify({
                          timestamp: new Date().toISOString(),
                          userAgent: navigator.userAgent,
                          url: window.location.href,
                          user: currentUser?.email,
                          localStorage: Object.keys(localStorage),
                          sessionStorage: Object.keys(sessionStorage)
                        }, null, 2)}</pre>
                      </body>
                    </html>
                  `)
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              정보 내보내기
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
