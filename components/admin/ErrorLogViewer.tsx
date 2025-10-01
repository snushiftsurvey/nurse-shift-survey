'use client'

import { useState, useEffect } from 'react'
import errorHandler, { ErrorLog } from '@/lib/errorHandler'

export default function ErrorLogViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'pause'>('all')
  const [isExpanded, setIsExpanded] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    refreshLogs()
    const interval = setInterval(refreshLogs, 5000) // 5초마다 새로고침
    return () => clearInterval(interval)
  }, [filter])

  const refreshLogs = () => {
    let filteredLogs: ErrorLog[]
    
    switch (filter) {
      case 'error':
        filteredLogs = errorHandler.getLogs('error')
        break
      case 'warn':
        filteredLogs = errorHandler.getLogs('warn')
        break
      case 'pause':
        filteredLogs = errorHandler.getPauseRelatedLogs()
        break
      default:
        filteredLogs = errorHandler.getLogs()
    }
    
    setLogs(filteredLogs.slice(0, 50)) // 최근 50개만 표시
    setStats(errorHandler.getStats())
  }

  const clearLogs = () => {
    if (confirm('모든 에러 로그를 삭제하시겠습니까?')) {
      errorHandler.clearLogs()
      refreshLogs()
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warn': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const truncateMessage = (message: string, maxLength: number = 80) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message
  }

  if (!isExpanded) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              📋 에러 로그 ({logs.length})
            </h3>
            {stats && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-1 bg-red-50 text-red-600 rounded">
                  에러: {stats.byLevel.error}
                </span>
                <span className="px-2 py-1 bg-yellow-50 text-yellow-600 rounded">
                  경고: {stats.byLevel.warn}
                </span>
                <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded">
                  일시정지: {stats.pauseRelated}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            자세히 보기 →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            📋 웹 로그 모니터
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshLogs}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              새로고침
            </button>
            <button
              onClick={clearLogs}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              로그 삭제
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              접기 ↑
            </button>
          </div>
        </div>

        {/* 통계 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">전체</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{stats.byLevel.error}</div>
              <div className="text-xs text-gray-500">에러</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.byLevel.warn}</div>
              <div className="text-xs text-gray-500">경고</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats.pauseRelated}</div>
              <div className="text-xs text-gray-500">일시정지</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.lastHour}</div>
              <div className="text-xs text-gray-500">최근 1시간</div>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">필터:</span>
          {['all', 'error', 'warn', 'pause'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterType === 'all' ? '전체' :
               filterType === 'error' ? '에러' :
               filterType === 'warn' ? '경고' :
               '일시정지'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            로그가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                        {getLevelIcon(log.level)} {log.level.toUpperCase()}
                      </span>
                      {log.isPauseRelated && (
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                          🛌 일시정지 관련
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 mb-1">
                      {truncateMessage(log.message)}
                    </div>
                    {log.context && (
                      <div className="text-xs text-gray-500">
                        {log.context.component && `컴포넌트: ${log.context.component}`}
                        {log.context.action && ` | 액션: ${log.context.action}`}
                      </div>
                    )}
                    {log.error && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                          에러 상세 정보 보기
                        </summary>
                        <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.error, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
