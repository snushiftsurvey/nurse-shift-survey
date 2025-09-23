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
    loadDraft(sid)
  }, [])

  const loadDraft = async (sid: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('consent_drafts')
        .select('*')
        .eq('session_id', sid)
        .single()

      if (error && error.code !== 'PGRST116') { // No rows found
        throw error
      }

      setDraft(data)
    } catch (error) {
      console.error('임시 저장 데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async (draftData: Partial<ConsentDraft>) => {
    if (!sessionId) return { success: false }

    try {
      setLoading(true)
      
      const payload = {
        session_id: sessionId,
        ...draftData,
        updated_at: new Date().toISOString()
      }

      if (draft?.id) {
        // 업데이트
        const { data, error } = await supabase
          .from('consent_drafts')
          .update(payload)
          .eq('id', draft.id)
          .select()
          .single()

        if (error) throw error
        setDraft(data)
      } else {
        // 새로 생성
        const { data, error } = await supabase
          .from('consent_drafts')
          .insert([payload])
          .select()
          .single()

        if (error) throw error
        setDraft(data)
      }

      return { success: true }
    } catch (error) {
      console.error('임시 저장 오류:', error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const clearDraft = async () => {
    try {
      if (draft?.id) {
        await supabase
          .from('consent_drafts')
          .delete()
          .eq('id', draft.id)
      }
      
      setDraft(null)
      sessionStorage.removeItem('consent_session_id')
    } catch (error) {
      console.error('임시 데이터 삭제 오류:', error)
    }
  }

  const startNewSession = () => {
    // 기존 세션 데이터 삭제
    sessionStorage.removeItem('consent_session_id')
    
    // 새로운 세션 ID 생성
    const newSid = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem('consent_session_id', newSid)
    
    // 상태 초기화
    setSessionId(newSid)
    setDraft(null)
    
    console.log('새로운 설문 세션 시작:', newSid)
  }

  return {
    draft,
    loading,
    sessionId,
    saveDraft,
    clearDraft,
    startNewSession,
    refresh: () => loadDraft(sessionId)
  }
}
