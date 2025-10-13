/**
 * Vercel Cron Job - Supabase Keep Alive
 * 매일 자동 실행되어 Supabase 일시정지 방지
 * 실행 결과를 cron_logs 테이블에 기록
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  const startTime = Date.now()
  
  try {
    // 🔐 보안: Vercel Cron 또는 인증된 요청만 허용
    const authHeader = req.headers['authorization']
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('🚫 Unauthorized cron request')
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid CRON_SECRET'
      })
    }
    
    console.log('🔄 [Cron] Keep-Alive 시작:', new Date().toISOString())
    
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. DB 핑 (surveys 테이블 조회)
    const { data: pingData, error: pingError } = await supabase
      .from('surveys')
      .select('id')
      .limit(1)
    
    if (pingError) {
      throw new Error(`DB Ping 실패: ${pingError.message}`)
    }
    
    const executionTime = Date.now() - startTime
    
    // 2. 성공 로그 기록
    const { error: logError } = await supabase
      .from('cron_logs')
      .insert({
        job_name: 'keep-alive',
        status: 'success',
        message: `DB 핑 성공 (${executionTime}ms)`,
        execution_time_ms: executionTime
      })
    
    if (logError) {
      console.warn('⚠️ 로그 기록 실패 (무시):', logError.message)
    }
    
    console.log(`✅ [Cron] Keep-Alive 성공 (${executionTime}ms)`)
    
    return res.status(200).json({
      success: true,
      message: 'Supabase keep-alive successful',
      executionTime,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    console.error('❌ [Cron] Keep-Alive 실패:', error)
    
    // 실패 로그 기록 시도
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase
        .from('cron_logs')
        .insert({
          job_name: 'keep-alive',
          status: 'error',
          message: error.message || error.toString(),
          execution_time_ms: executionTime
        })
    } catch (logError) {
      console.warn('⚠️ 에러 로그 기록 실패:', logError)
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      executionTime,
      timestamp: new Date().toISOString()
    })
  }
}

