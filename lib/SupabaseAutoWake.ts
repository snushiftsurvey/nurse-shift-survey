import { createClient, SupabaseClient } from '@supabase/supabase-js';
import errorHandler from './errorHandler';

/**
 * Supabase 자동 깨우기 유틸리티 (TypeScript 버전)
 * 무료티어 일시정지 상태를 감지하고 자동으로 깨우는 기능
 */
interface AutoWakeOptions {
  maxAttempts?: number;      // 최대 시도 횟수
  retryInterval?: number;    // 재시도 간격 (ms)
  testTable?: string;        // 연결 테스트용 테이블
  enableLogs?: boolean;      // 로그 출력 여부
  enableAutoRetry?: boolean; // 자동 재시도 활성화
}

interface HealthCheckResult {
  status: 'healthy' | 'error' | 'paused';
  timestamp: string;
  error: string | null;
  isPaused: boolean;
  responseTime?: number;
}

class SupabaseAutoWake {
  private supabaseUrl: string;
  private supabaseKey: string;
  private supabase: SupabaseClient;
  private isWakingUp: boolean = false;
  private options: Required<AutoWakeOptions>;
  
  constructor(supabaseUrl: string, supabaseKey: string, options: AutoWakeOptions = {}) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    
    // 설정 옵션
    this.options = {
      maxAttempts: options.maxAttempts ?? 12,
      retryInterval: options.retryInterval ?? 5000,
      testTable: options.testTable ?? 'surveys',  // 실제 존재하는 테이블 사용
      enableLogs: options.enableLogs ?? true,
      enableAutoRetry: options.enableAutoRetry ?? true,
    };
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase URL과 Key가 필요합니다.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * 로그 출력 (옵션에 따라) - ErrorHandler 통합
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info', data?: any): void {
    const fullMessage = `[🔄 Supabase AutoWake] ${message}`;
    
    if (this.options.enableLogs) {
      const prefix = '[🔄 Supabase AutoWake]';
      switch (level) {
        case 'warn':
          console.warn(`${prefix} ⚠️  ${message}`, data);
          errorHandler.logWarning(fullMessage, data, { component: 'SupabaseAutoWake' });
          break;
        case 'error':
          console.error(`${prefix} ❌ ${message}`, data);
          errorHandler.logError(fullMessage, data, { component: 'SupabaseAutoWake' });
          break;
        default:
          console.log(`${prefix} ${message}`, data);
          errorHandler.logInfo(fullMessage, data, { component: 'SupabaseAutoWake' });
      }
    } else {
      // 콘솔 로그가 비활성화되어도 에러는 ErrorHandler에 기록
      if (level === 'error') {
        errorHandler.logError(fullMessage, data, { component: 'SupabaseAutoWake' });
      } else if (level === 'warn') {
        errorHandler.logWarning(fullMessage, data, { component: 'SupabaseAutoWake' });
      }
    }
  }

  /**
   * 에러가 일시정지 상태를 나타내는지 확인
   */
  private isPauseError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code || error.status || '';
    
    const pauseIndicators = [
      // 네트워크 관련
      'fetch failed',
      'ENOTFOUND',
      'timeout',
      'ECONNREFUSED', 
      'network error',
      'connection refused',
      'connection timeout',
      
      // Supabase 관련
      'temporary failure',
      'service unavailable',
      'database is paused',
      'project paused',
      
      // HTTP 상태 코드
      '500',
      '502',
      '503',
      '504',
      'internal server error',
      'bad gateway',
      'service temporarily unavailable',
      'gateway timeout'
    ];
    
    return pauseIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase()) ||
      errorCode.toString().includes(indicator)
    );
  }

  /**
   * Supabase 연결 상태 확인
   */
  async checkConnection(): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      this.log('🔍 연결 상태 확인 중...');
      
      // 간단한 쿼리로 연결 상태 확인 (COUNT로 빠른 응답)
      const { data, error, count } = await this.supabase
        .from(this.options.testTable)
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (!error) {
        this.log(`✅ 연결 정상 (응답시간: ${responseTime}ms)`);
        return true;
      }
      
      this.log(`⚠️ 연결 확인 중 에러: ${error.message}`, 'warn');
      
      const isPaused = this.isPauseError(error);
      if (isPaused) {
        this.log('🛌 일시정지 상태 감지됨', 'warn');
      }
      
      return !isPaused; // 일시정지가 아니면 true 반환
      
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      this.log(`❌ 연결 확인 실패 (${responseTime}ms): ${err.message}`, 'error', err);
      return !this.isPauseError(err);
    }
  }

  /**
   * 데이터베이스 깨우기
   */
  async wakeUpDatabase(): Promise<boolean> {
    if (this.isWakingUp) {
      this.log('⏳ 이미 깨우기 진행 중입니다...');
      return false;
    }
    
    this.isWakingUp = true;
    
    try {
      const totalTime = (this.options.maxAttempts * this.options.retryInterval) / 1000;
      this.log(`🚀 데이터베이스 깨우는 중... (최대 ${totalTime}초 소요)`);
      
      for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
        this.log(`🔄 깨우기 시도 ${attempt}/${this.options.maxAttempts}...`);
        
        const startTime = Date.now();
        
        try {
          // 여러 유형의 쿼리로 데이터베이스 활성화
          const queries = [
            // 1. 테이블 존재 확인
            this.supabase.from(this.options.testTable).select('count', { count: 'exact', head: true }).limit(1),
            // 2. 간단한 SELECT
            this.supabase.from(this.options.testTable).select('id').limit(1),
          ];
          
          // 병렬로 쿼리 실행하여 빠른 깨우기
          const results = await Promise.allSettled(queries);
          const responseTime = Date.now() - startTime;
          
          // 하나라도 성공하면 깨어난 것으로 간주
          const hasSuccess = results.some(result => result.status === 'fulfilled' && !result.value.error);
          
          if (hasSuccess) {
            this.log(`🎉 데이터베이스 깨우기 성공! (${responseTime}ms)`);
            this.isWakingUp = false;
            return true;
          }
          
          // 모든 쿼리가 실패한 경우 에러 로그
          const errors = results
            .filter(result => result.status === 'fulfilled')
            .map((result: any) => result.value.error?.message)
            .filter(Boolean);
          
          this.log(`⚠️ 시도 ${attempt} 실패 (${responseTime}ms): ${errors.join(', ')}`, 'warn');
          
        } catch (err: any) {
          const responseTime = Date.now() - startTime;
          this.log(`❌ 시도 ${attempt} 에러 (${responseTime}ms): ${err.message}`, 'error', err);
        }
        
        // 마지막 시도가 아니면 대기
        if (attempt < this.options.maxAttempts) {
          this.log(`⏱️  ${this.options.retryInterval / 1000}초 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, this.options.retryInterval));
        }
      }
      
      this.log('💔 데이터베이스 깨우기 실패. 수동으로 Supabase 대시보드를 확인해주세요.', 'error');
      this.isWakingUp = false;
      return false;
      
    } catch (err: any) {
      this.log(`💥 깨우기 과정에서 에러 발생: ${err.message}`, 'error', err);
      this.isWakingUp = false;
      return false;
    }
  }

  /**
   * 안전한 쿼리 실행 (자동 깨우기 포함)
   */
  async safeQuery<T>(queryFn: () => Promise<T>, maxRetries = 1): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 쿼리 실행 시도
        const result = await queryFn();
        
        // 첫 번째 시도가 성공하면 바로 반환
        if (attempt === 0) {
          return result;
        } else {
          this.log(`✅ 재시도 ${attempt}번째에서 성공`);
          return result;
        }
        
      } catch (error: any) {
        lastError = error;
        
        // 일시정지 에러 시에만 자동 깨우기 시도
        if (this.isPauseError(error) && this.options.enableAutoRetry) {
          this.log(`🛌 일시정지 상태 감지 (시도 ${attempt + 1}/${maxRetries + 1}). 자동 깨우기 시도...`, 'warn');
          
          const wakeUpSuccess = await this.wakeUpDatabase();
          
          if (wakeUpSuccess && attempt < maxRetries) {
            this.log('✨ 깨우기 성공. 쿼리 재시도...');
            continue; // 다음 반복으로
          } else if (!wakeUpSuccess) {
            throw new Error(`Supabase 데이터베이스가 일시정지 상태이며 자동 깨우기에 실패했습니다. 원본 에러: ${error.message}`);
          }
        }
        
        // 일시정지 에러가 아니거나 마지막 시도인 경우
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // 일반 에러의 경우 짧은 지연 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw lastError;
  }

  /**
   * 연결 상태 확인 및 필요시 깨우기
   */
  async ensureConnection(): Promise<boolean> {
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      this.log('🛌 일시정지 상태 감지됨. 자동 깨우기 시도 중...', 'warn');
      return await this.wakeUpDatabase();
    }
    
    return true;
  }

  /**
   * 헬스체크 (주기적 연결 확인용)
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { data, error, count } = await this.supabase
        .from(this.options.testTable)
        .select('*', { count: 'exact', head: true })
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (!error) {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          error: null,
          isPaused: false,
          responseTime
        };
      }
      
      const isPaused = this.isPauseError(error);
      
      return {
        status: isPaused ? 'paused' : 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        isPaused,
        responseTime
      };
      
    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      const isPaused = this.isPauseError(err);
      
      return {
        status: isPaused ? 'paused' : 'error',
        timestamp: new Date().toISOString(),
        error: err.message,
        isPaused,
        responseTime
      };
    }
  }

  /**
   * 설정 업데이트
   */
  updateOptions(newOptions: Partial<AutoWakeOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.log(`⚙️ 설정 업데이트됨: ${JSON.stringify(newOptions)}`);
  }

  /**
   * 상태 정보 반환
   */
  getStatus(): { isWakingUp: boolean; options: Required<AutoWakeOptions> } {
    return {
      isWakingUp: this.isWakingUp,
      options: { ...this.options }
    };
  }
}

export default SupabaseAutoWake;
export type { AutoWakeOptions, HealthCheckResult };
