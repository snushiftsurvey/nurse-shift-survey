import { useState, useEffect } from 'react'

interface ConsentDraft {
  consent_name?: string
  consent_signature1?: string
  consent_signature2?: string
  consent_date?: string
  researcher_id?: string
}

const STORAGE_KEY = 'nurse_survey_consent_draft'

export function useConsentDraft() {
  const [draft, setDraft] = useState<ConsentDraft | null>(null)
  const [loading, setLoading] = useState(false)

  // 컴포넌트 마운트 시 LocalStorage에서 로드
  useEffect(() => {
    loadDraft()
  }, [])

  const loadDraft = () => {
    try {
      setLoading(true)
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('✅ [LOAD DRAFT] LocalStorage에서 로딩 성공:', {
          hasSignature1: !!parsed.consent_signature1,
          hasSignature2: !!parsed.consent_signature2,
          date: parsed.consent_date
        })
        setDraft(parsed)
      } else {
        console.log('ℹ️ [LOAD DRAFT] 저장된 draft 없음')
        setDraft(null)
      }
    } catch (error) {
      console.error('❌ [LOAD DRAFT] LocalStorage 로딩 오류:', error)
      setDraft(null)
    } finally {
      setLoading(false)
    }
  }

  const saveDraft = async (draftData: Partial<ConsentDraft>) => {
    try {
      setLoading(true)
      console.log('💾 [SAVE DRAFT] LocalStorage에 저장 시도:', {
        hasSignature1: !!draftData.consent_signature1,
        hasSignature2: !!draftData.consent_signature2,
        date: draftData.consent_date
      })

      const newDraft = {
        ...draft,
        ...draftData
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDraft))
      setDraft(newDraft)
      
      console.log('✅ [SAVE DRAFT] LocalStorage 저장 완료')
      return { success: true }
    } catch (error) {
      console.error('❌ [SAVE DRAFT] LocalStorage 저장 오류:', error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const clearDraft = () => {
    try {
      console.log('🗑️ [CLEAR DRAFT] LocalStorage 정리')
      localStorage.removeItem(STORAGE_KEY)
      setDraft(null)
    } catch (error) {
      console.error('❌ [CLEAR DRAFT] LocalStorage 정리 오류:', error)
    }
  }

  const startNewSession = () => {
    console.log('🆕 [NEW SESSION] 새로운 설문 시작 - draft 초기화')
    clearDraft()
  }

  return {
    draft,
    loading,
    sessionId: '', // 호환성을 위해 빈 값 유지
    saveDraft,
    clearDraft,
    startNewSession,
    refresh: loadDraft
  }
}
