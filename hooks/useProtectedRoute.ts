'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSurvey } from './useSurvey'

/**
 * 설문이 시작되지 않았을 때 홈으로 리다이렉트하는 훅
 * 외부에서 설문 중간 페이지에 직접 접근하는 것을 방지
 */
export function useProtectedRoute() {
  const { state } = useSurvey()
  const router = useRouter()

  useEffect(() => {
    // 설문이 시작되지 않았으면 홈으로 리다이렉트
    if (!state.surveyStarted) {
      router.replace('/')
    }
  }, [state.surveyStarted, router])

  return state.surveyStarted
}




