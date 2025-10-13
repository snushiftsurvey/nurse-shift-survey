/**
 * 전역 에러 핸들링 및 로깅 유틸리티
 * Supabase AutoWake와 연동하여 일시정지 상태 감지 및 처리
 */

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp?: string
  userAgent?: string
  url?: string
}

interface ErrorLog {
  id: string
  level: 'info' | 'warn' | 'error' | 'critical'
  message: string
  error?: any
  context?: ErrorContext
  timestamp: string
  isPauseRelated?: boolean
}

class ErrorHandler {
  private logs: ErrorLog[] = []
  private maxLogs = 100
  private enableConsoleLog = true
  private enableLocalStorage = true

  constructor() {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers()
      this.loadLogsFromStorage()
    }
  }

  /**
   * 전역 에러 핸들러 설정
   */
  private setupGlobalErrorHandlers() {
    // JavaScript 에러 캐치
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', event.error, {
        component: 'Global',
        action: 'Runtime Error',
        url: window.location.href
      })
    })

    // Promise rejection 캐치
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason, {
        component: 'Global',
        action: 'Promise Rejection',
        url: window.location.href
      })
    })
  }

  /**
   * 에러 로깅
   */
  logError(message: string, error?: any, context?: ErrorContext) {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      level: 'error',
      message,
      error: this.serializeError(error),
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      },
      timestamp: new Date().toISOString(),
      isPauseRelated: this.isPauseRelatedError(error)
    }

    this.addLog(errorLog)

    if (this.enableConsoleLog) {
      console.error(`[ErrorHandler] ${message}`, {
        error,
        context,
        isPauseRelated: errorLog.isPauseRelated
      })
    }

    // Slack 알림 전송 (서버 환경에서만)
    if (typeof window === 'undefined' && process.env.SLACK_WEBHOOK_URL) {
      this.sendSlackAlert(errorLog)
    }
  }

  /**
   * 경고 로깅
   */
  logWarning(message: string, data?: any, context?: ErrorContext) {
    const warningLog: ErrorLog = {
      id: this.generateId(),
      level: 'warn',
      message,
      error: data,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      },
      timestamp: new Date().toISOString(),
      isPauseRelated: this.isPauseRelatedError(data)
    }

    this.addLog(warningLog)

    if (this.enableConsoleLog) {
      console.warn(`[ErrorHandler] ${message}`, { data, context })
    }
  }

  /**
   * 정보 로깅
   */
  logInfo(message: string, data?: any, context?: ErrorContext) {
    const infoLog: ErrorLog = {
      id: this.generateId(),
      level: 'info',
      message,
      error: data,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      },
      timestamp: new Date().toISOString()
    }

    this.addLog(infoLog)

    if (this.enableConsoleLog) {
      console.info(`[ErrorHandler] ${message}`, { data, context })
    }
  }

  /**
   * 일시정지 관련 에러인지 확인
   */
  private isPauseRelatedError(error: any): boolean {
    if (!error) return false
    
    const errorMessage = error.message || error.toString() || ''
    const errorCode = error.code || error.status || ''
    
    const pauseIndicators = [
      'fetch failed',
      'ENOTFOUND',
      'timeout',
      'ECONNREFUSED',
      'network error',
      'temporary failure',
      'service unavailable',
      'database is paused',
      'project paused',
      '500',
      '502',
      '503',
      '504'
    ]
    
    return pauseIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase()) ||
      errorCode.toString().includes(indicator)
    )
  }

  /**
   * Slack 알림 전송
   */
  private async sendSlackAlert(errorLog: ErrorLog) {
    try {
      const isPauseRelated = errorLog.isPauseRelated ? ' (일시정지 관련)' : ''
      const emoji = errorLog.level === 'critical' ? '🔥' : '🚨'
      const projectName = process.env.PROJECT_NAME || 'Nurse Shift Survey'
      
      await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${emoji} [${projectName}] ${errorLog.message}${isPauseRelated} <!here>`,
          attachments: [{
            color: errorLog.level === 'critical' ? 'danger' : 'warning',
            fields: [
              { 
                title: 'URL', 
                value: errorLog.context?.url || 'Unknown', 
                short: true 
              },
              { 
                title: '시간', 
                value: new Date(errorLog.timestamp).toLocaleString('ko-KR'), 
                short: true 
              },
              { 
                title: '레벨', 
                value: errorLog.level.toUpperCase(), 
                short: true 
              },
              { 
                title: '컴포넌트', 
                value: errorLog.context?.component || 'Unknown', 
                short: true 
              }
            ],
            footer: errorLog.isPauseRelated ? 'Supabase 일시정지 감지됨' : 'Nurse Shift Survey',
            ts: Math.floor(new Date(errorLog.timestamp).getTime() / 1000)
          }]
        })
      })
    } catch (slackError) {
      // Slack 전송 실패는 콘솔에만 로그 (무한루프 방지)
      console.warn('[ErrorHandler] Slack 알림 전송 실패:', slackError)
    }
  }

  /**
   * 에러 직렬화 (순환 참조 방지)
   */
  private serializeError(error: any): any {
    if (!error) return null

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        status: (error as any).status
      }
    }

    if (typeof error === 'object') {
      try {
        return JSON.parse(JSON.stringify(error))
      } catch {
        return { message: error.toString() }
      }
    }

    return { message: error.toString() }
  }

  /**
   * 로그 추가
   */
  private addLog(log: ErrorLog) {
    this.logs.unshift(log)
    
    // 최대 로그 수 제한
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 로컬 스토리지에 저장
    if (this.enableLocalStorage) {
      this.saveLogsToStorage()
    }
  }

  /**
   * 로그 조회
   */
  getLogs(level?: 'info' | 'warn' | 'error' | 'critical'): ErrorLog[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  /**
   * 일시정지 관련 로그만 조회
   */
  getPauseRelatedLogs(): ErrorLog[] {
    return this.logs.filter(log => log.isPauseRelated)
  }

  /**
   * 최근 로그 조회
   */
  getRecentLogs(minutes: number = 10): ErrorLog[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.logs.filter(log => new Date(log.timestamp) > cutoff)
  }

  /**
   * 로그 클리어
   */
  clearLogs() {
    this.logs = []
    if (this.enableLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem('supabase-error-logs')
    }
  }

  /**
   * 로컬 스토리지에서 로그 로드
   */
  private loadLogsFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('supabase-error-logs')
      if (stored) {
        const logs = JSON.parse(stored)
        if (Array.isArray(logs)) {
          this.logs = logs.slice(0, this.maxLogs)
        }
      }
    } catch (error) {
      console.warn('Failed to load error logs from storage:', error)
    }
  }

  /**
   * 로컬 스토리지에 로그 저장
   */
  private saveLogsToStorage() {
    if (typeof window === 'undefined') return

    try {
      // 최근 50개만 저장 (용량 절약)
      const logsToSave = this.logs.slice(0, 50)
      localStorage.setItem('supabase-error-logs', JSON.stringify(logsToSave))
    } catch (error) {
      console.warn('Failed to save error logs to storage:', error)
    }
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: {
    enableConsoleLog?: boolean
    enableLocalStorage?: boolean
    maxLogs?: number
  }) {
    if (config.enableConsoleLog !== undefined) {
      this.enableConsoleLog = config.enableConsoleLog
    }
    if (config.enableLocalStorage !== undefined) {
      this.enableLocalStorage = config.enableLocalStorage
    }
    if (config.maxLogs !== undefined) {
      this.maxLogs = config.maxLogs
    }
  }

  /**
   * 통계 정보 반환
   */
  getStats() {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)

    const last24hLogs = this.logs.filter(log => new Date(log.timestamp) > last24h)
    const lastHourLogs = this.logs.filter(log => new Date(log.timestamp) > lastHour)

    return {
      total: this.logs.length,
      last24h: last24hLogs.length,
      lastHour: lastHourLogs.length,
      pauseRelated: this.logs.filter(log => log.isPauseRelated).length,
      byLevel: {
        info: this.logs.filter(log => log.level === 'info').length,
        warn: this.logs.filter(log => log.level === 'warn').length,
        error: this.logs.filter(log => log.level === 'error').length,
        critical: this.logs.filter(log => log.level === 'critical').length
      }
    }
  }
}

// 싱글톤 인스턴스
const errorHandler = new ErrorHandler()

export default errorHandler
export type { ErrorLog, ErrorContext }
