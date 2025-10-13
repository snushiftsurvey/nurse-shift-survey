'use client'

import { useState } from 'react'
import { healthCheck, wakeUp } from '@/lib/supabase'

interface HealthStatus {
  status: 'healthy' | 'error' | 'paused' | 'unknown'
  timestamp: string
  error?: string
  responseTime?: number
  isPaused?: boolean
}

interface AllHealthStatus {
  admin: HealthStatus
  public: HealthStatus
  server: HealthStatus
  timestamp: string
}

export default function SupabaseHealthCheck() {
  const [healthStatus, setHealthStatus] = useState<AllHealthStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isWakingUp, setIsWakingUp] = useState<{[key: string]: boolean}>({})

  const checkHealth = async () => {
    setIsChecking(true)
    try {
      const result = await healthCheck.all()
      setHealthStatus(result)
    } catch (error) {
      console.error('헬스체크 실패:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const wakeUpDatabase = async (type: 'admin' | 'public' | 'server' | 'all') => {
    setIsWakingUp(prev => ({ ...prev, [type]: true }))
    try {
      let result: any
      switch (type) {
        case 'admin':
          result = await wakeUp.admin()
          break
        case 'public':
          result = await wakeUp.public()
          break
        case 'server':
          result = await wakeUp.server()
          break
        case 'all':
          result = await wakeUp.all()
          break
      }
      
      console.log(`${type} 데이터베이스 깨우기 결과:`, result)
      
      // 깨우기 후 헬스체크 재실행
      await checkHealth()
    } catch (error) {
      console.error(`${type} 데이터베이스 깨우기 실패:`, error)
    } finally {
      setIsWakingUp(prev => ({ ...prev, [type]: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'paused': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'paused': return '🛌'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime) return 'N/A'
    return `${responseTime}ms`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          Supabase 연결 상태 모니터
        </h3>
        <button
          onClick={checkHealth}
          disabled={isChecking}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
        >
          {isChecking ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              확인 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              헬스체크
            </>
          )}
        </button>
      </div>

      {healthStatus && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            마지막 확인: {new Date(healthStatus.timestamp).toLocaleString('ko-KR')}
          </div>
          
          {/* 관리자 클라이언트 상태 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                {getStatusIcon(healthStatus.admin.status)} 관리자 클라이언트
              </h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthStatus.admin.status)}`}>
                  {healthStatus.admin.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {formatResponseTime(healthStatus.admin.responseTime)}
                </span>
              </div>
            </div>
            {healthStatus.admin.error && (
              <div className="text-sm text-red-600 mb-2">
                에러: {healthStatus.admin.error}
              </div>
            )}
            {healthStatus.admin.isPaused && (
              <button
                onClick={() => wakeUpDatabase('admin')}
                disabled={isWakingUp.admin}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                {isWakingUp.admin ? '깨우는 중...' : '관리자 DB 깨우기'}
              </button>
            )}
          </div>

          {/* 공개 클라이언트 상태 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                {getStatusIcon(healthStatus.public.status)} 공개 클라이언트
              </h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthStatus.public.status)}`}>
                  {healthStatus.public.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {formatResponseTime(healthStatus.public.responseTime)}
                </span>
              </div>
            </div>
            {healthStatus.public.error && (
              <div className="text-sm text-red-600 mb-2">
                에러: {healthStatus.public.error}
              </div>
            )}
            {healthStatus.public.isPaused && (
              <button
                onClick={() => wakeUpDatabase('public')}
                disabled={isWakingUp.public}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                {isWakingUp.public ? '깨우는 중...' : '공개 DB 깨우기'}
              </button>
            )}
          </div>

          {/* 서버 클라이언트 상태 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                {getStatusIcon(healthStatus.server.status)} 서버 클라이언트
              </h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthStatus.server.status)}`}>
                  {healthStatus.server.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {formatResponseTime(healthStatus.server.responseTime)}
                </span>
              </div>
            </div>
            {healthStatus.server.error && (
              <div className="text-sm text-red-600 mb-2">
                에러: {healthStatus.server.error}
              </div>
            )}
            {healthStatus.server.isPaused && (
              <button
                onClick={() => wakeUpDatabase('server')}
                disabled={isWakingUp.server}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                {isWakingUp.server ? '깨우는 중...' : '서버 DB 깨우기'}
              </button>
            )}
          </div>

          {/* 전체 깨우기 버튼 */}
          <div className="flex justify-center pt-4 border-t">
            <button
              onClick={() => wakeUpDatabase('all')}
              disabled={isWakingUp.all}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              {isWakingUp.all ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  모든 DB 깨우는 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  모든 데이터베이스 깨우기
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!healthStatus && (
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          헬스체크 버튼을 클릭하여 연결 상태를 확인하세요.
        </div>
      )}
    </div>
  )
}

