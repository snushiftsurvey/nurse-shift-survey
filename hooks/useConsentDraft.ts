import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ConsentDraft {
  id?: string
  session_id: string
  consent_name?: string
  consent_signature1?: string
  consent_signature2?: string
  consent_date?: string
  researcher_id?: string
}

export function useConsentDraft() {
  const [draft, setDraft] = useState<ConsentDraft | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // 브라우저 세션 ID 생성 (새로고침 시에도 유지)
    let sid = sessionStorage.getItem('consent_session_id')
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
      sessionStorage.setItem('consent_session_id', sid)
    }
    setSessionId(sid)

    // 세션 ID가 준비된 경우에만 로드 (빈 값 조회로 인한 406 방지)
    if (sid) {
      loadDraft(sid)
    } else {
      console.warn('⚠️ 세션 ID가 비어 있어 임시 데이터 로딩을 건너뜀')
    }
    // console.log('📝 세션 ID 초기화 및 자동 로딩 완료 (DB 방식):', sid)

    // 설문 중단 시 서명 데이터 자동 정리 이벤트 리스너 (매우 제한적)
    const handleBeforeUnload = () => {
      const currentPath = window.location.pathname
      // 매우 제한적인 정리 - 홈페이지나 설문 시작 페이지에서만
      if (currentPath === '/' || currentPath === '/survey') {
        // console.log('🧹 브라우저 종료/새로고침 감지 - 홈/설문시작 페이지에서 임시 데이터 정리')
        clearDraftSync(sid)
      } else {
        // console.log('📝 설문 진행 중 - 임시 데이터 보존 (경로:', currentPath, ')')
      }
    }

    const handlePageHide = () => {
      // 페이지 숨김 시에는 정리하지 않음 (너무 공격적)
      // console.log('📝 페이지 숨김 감지 - 임시 데이터 보존 (경로:', window.location.pathname, ')')
    }

    // 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [])

  const loadDraft = async (sid: string) => {
    try {
      setLoading(true)
      if (!sid) {
        console.warn('⚠️ loadDraft 호출 시 세션 ID가 비어 있음 - 로딩 스킵')
        setDraft(null)
        return
      }
      // console.log('🔄 surveys 테이블에서 임시 데이터 로딩 시도 (406 에러 완전 회피):', sid)
      
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('consent_draft_data->>session_id', sid)
        .eq('is_draft', true)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          // console.log('📄 새로운 세션 - 기존 임시 데이터 없음')
          setDraft(null)
          return
        } else {
          console.error('❌ surveys 테이블 임시 저장 데이터 로딩 오류:', error)
          setDraft(null)
          return
        }
      }

      if (!data) {
        // console.log('ℹ️ 임시 데이터 없음 (0행)')
        setDraft(null)
        return
      }

      // JSON 데이터에서 draft 정보 추출
      const draftData = data.consent_draft_data as any
      // console.log('✅ surveys 테이블에서 임시 저장 데이터 로딩 완료:', {
      //   survey_id: data.id,
      //   session_id: draftData?.session_id,
      //   consent_name: draftData?.consent_name,
      //   hasSignature1: !!draftData?.consent_signature1,
      //   hasSignature2: !!draftData?.consent_signature2
      // })
      
      // ConsentDraft 형태로 변환
      const convertedDraft = {
        id: data.id,
        session_id: draftData?.session_id || sid,
        consent_name: draftData?.consent_name,
        consent_signature1: draftData?.consent_signature1,
        consent_signature2: draftData?.consent_signature2,
        consent_date: draftData?.consent_date,
        researcher_id: draftData?.researcher_id
      }
      setDraft(convertedDraft as ConsentDraft)
    } catch (error) {
      console.error('❌ surveys 테이블 임시 저장 데이터 로딩 예외:', error)
      setDraft(null)
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async (draftData: Partial<ConsentDraft>) => {
    if (!sessionId) return { success: false, error: '세션 ID 없음' }

    try {
      setLoading(true)
      // console.log('💾 surveys 테이블에 임시 저장 시도 (406 에러 완전 회피):', { sessionId, draftData })
      
      const draftPayload = {
        session_id: sessionId,
        ...draftData,
        updated_at: new Date().toISOString()
      }

      // surveys 테이블에 임시 저장 (JSONB 컬럼 사용)
      const surveyPayload = {
        gender: 'draft_temp',
        age: 25, // age는 integer 타입
        hire_year: 2025,
        hire_month: 1,
        medical_institution_type: 'draft_temp',
        medical_institution_location: 'draft_temp',
        department: 'draft_temp',
        shift_data: {},
        work_types: [],
        off_duty_types: [],
        consent_personal_info: false,
        consent_draft_data: draftPayload,
        is_draft: true
      }

      // 기존 draft가 있으면 업데이트, 없으면 새로 생성
      let result
      if (draft?.id) {
        // console.log('🔄 기존 draft 업데이트:', draft.id)
        const { data, error } = await supabase
          .from('surveys')
          .update({
            consent_draft_data: draftPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id)
          .eq('is_draft', true)
          .select()
          .single()
        result = { data, error }
      } else {
        // console.log('🆕 새로운 draft 생성')
        const { data, error } = await supabase
          .from('surveys')
          .insert(surveyPayload)
          .select()
          .single()
        result = { data, error }
      }

      if (result.error) {
        console.error('❌ surveys 테이블 저장 오류:', result.error)
        return { success: false, error: result.error.message }
      }
      
      // console.log('✅ surveys 테이블 저장 완료:', result.data)
      
      // ConsentDraft 형태로 변환해서 상태 업데이트
      const convertedDraft = {
        id: result.data.id,
        session_id: sessionId,
        consent_name: draftData.consent_name,
        consent_signature1: draftData.consent_signature1,
        consent_signature2: draftData.consent_signature2,
        consent_date: draftData.consent_date,
        researcher_id: draftData.researcher_id
      }
      setDraft(convertedDraft as ConsentDraft)
      return { success: true }
    } catch (error) {
      console.error('❌ surveys 테이블 임시 저장 오류:', error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }


  const clearDraft = async () => {
    try {
      // surveys 테이블에서 draft 삭제 (406 에러 완전 회피)
      if (draft?.id) {
        await supabase
          .from('surveys')
          .delete()
          .eq('id', draft.id)
          .eq('is_draft', true)
        // console.log('🗑️ surveys 테이블 임시 데이터 삭제 완료:', draft.id)
      } else if (sessionId) {
        // ID가 없으면 session_id로 찾아서 삭제
        await supabase
          .from('surveys')
          .delete()
          .eq('consent_draft_data->>session_id', sessionId)
          .eq('is_draft', true)
        // console.log('🗑️ surveys 테이블 임시 데이터 삭제 완료 (session_id 방식):', sessionId)
      }
      
      setDraft(null)
      sessionStorage.removeItem('consent_session_id')
    } catch (error) {
      console.error('❌ surveys 테이블 임시 데이터 삭제 오류:', error)
    }
  }

  // 동기식 정리 (브라우저 종료 시 사용) - 제한적 사용
  const clearDraftSync = (sid: string) => {
    try {
      // 브라우저 종료 시에는 DB 요청이 제한적이므로 sessionStorage만 정리
      sessionStorage.removeItem('consent_session_id')
      // console.log('🧹 브라우저 종료 시 세션 정리 완료:', sid)
      
      // 상태 즉시 초기화
      setDraft(null)
    } catch (error) {
      console.error('❌ 동기 데이터 정리 오류:', error)
    }
  }

  const startNewSession = () => {
    // 기존 세션 데이터 정리
    sessionStorage.removeItem('consent_session_id')
    
    // 새로운 세션 ID 생성
    const newSid = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem('consent_session_id', newSid)
    
    // 상태 초기화
    setSessionId(newSid)
    setDraft(null)
    
    // console.log('🆕 새로운 설문 세션 시작 (surveys 테이블 활용):', newSid)
  }

  return {
    draft,
    loading,
    sessionId,
    saveDraft,
    clearDraft,
    clearDraftSync,
    startNewSession,
    refresh: () => {
      const sid = sessionId || sessionStorage.getItem('consent_session_id') || ''
      if (!sid) {
        console.warn('⚠️ refresh 호출 시 세션 ID 없음 - 로딩 생략')
        return
      }
      return loadDraft(sid)
    }
  }
}
