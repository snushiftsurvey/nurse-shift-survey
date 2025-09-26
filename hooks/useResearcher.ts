import { useState, useEffect } from 'react'
import { supabasePublic } from '@/lib/supabase'

interface ResearcherProfile {
  id: string
  name: string
  signature_image: string
  is_active: boolean
}

export function useResearcher() {
  const [researcher, setResearcher] = useState<ResearcherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveResearcher()
  }, [])

  const fetchActiveResearcher = async () => {
    try {
      setLoading(true)
      
      // 활성 연구원 정보 조회 (첫 번째 활성 연구원)
      const { data, error } = await supabasePublic
        .from('researcher_profiles')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (error) {
        throw error
      }

      setResearcher(data)
    } catch (error) {
      console.error('연구원 정보 조회 오류:', error)
      setError('연구원 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateResearcher = async (name: string, signatureImage: string) => {
    if (!researcher) return

    try {
      const { error } = await supabasePublic
        .from('researcher_profiles')
        .update({
          name,
          signature_image: signatureImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', researcher.id)

      if (error) throw error

      // 로컬 상태 업데이트
      setResearcher(prev => prev ? { ...prev, name, signature_image: signatureImage } : null)
      
      return { success: true }
    } catch (error) {
      console.error('연구원 정보 업데이트 오류:', error)
      return { success: false, error: '연구원 정보 업데이트에 실패했습니다.' }
    }
  }

  return {
    researcher,
    loading,
    error,
    updateResearcher,
    refresh: fetchActiveResearcher
  }
}
