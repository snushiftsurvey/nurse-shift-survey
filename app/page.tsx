'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSurvey } from '@/hooks/useSurvey'
import { supabasePublic } from '@/lib/supabase'

export default function HomePage() {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const { forceClearAll, startSurvey } = useSurvey()

  const handleStartSurvey = async () => {

    
    try {
      setIsNavigating(true)
      
      // 전체 응답자 수 제한만 확인
      const { data: totalLimitData } = await supabasePublic
        .from('survey_limits')
        .select('setting_value')
        .eq('setting_name', 'total_limit')
        .single()
      
      const totalLimit = totalLimitData?.setting_value || 350

      const { count: totalCount } = await supabasePublic
        .from('surveys')
        .select('*', { count: 'exact', head: true })
      
      if (totalCount && totalCount >= totalLimit) {
        alert('가능한 설문응답이 종료되었습니다\n(사유: 전체 응답자 수 초과)')
        setIsNavigating(false)
        return
      }
      
     // console.log(` 전체 제한 확인 통과: ${totalCount}/${totalLimit}`)
     // console.log('설문 시작 - 모든 데이터 완전 초기화')
      
      // 강제 전체 초기화
      forceClearAll()
      
      // 설문 시작 상태 설정
      startSurvey()
      
      // 페이지 이동
      setTimeout(() => {
        router.push('/survey')
      }, 300)
      
    } catch (error) {
      console.error('❌ 설문 시작 중 예상치 못한 오류:', error)
      alert('설문 시작 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setIsNavigating(false)
    }
  }
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-1 py-4 transition-opacity duration-500 ${
      isNavigating ? 'opacity-90' : 'opacity-100'
    }`}>
      <div className="max-w-2xl mx-auto text-center">
        <div className={`bg-white rounded-lg shadow-xl p-8 md:p-18 transition-transform duration-300 relative overflow-hidden ${
          isNavigating ? 'scale-98' : 'scale-100'
        }`}>
          {/* 파랑색 책갈피 */}
          <div className="absolute top-0 left-0 w-16 h-16 md:w-20 md:h-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 transform rotate-45 -translate-x-8 -translate-y-8 md:-translate-x-10 md:-translate-y-10 shadow-lg"></div>
          </div>
          <h1 className="text-xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
            간호사 교대근무 설문조사
          </h1>
          
          <div className="text-gray-600 mb-6 md:mb-8 space-y-1">
       
          
          </div>

          <div className="flex items-center gap-2 md:gap-6 mb-6 md:mb-10">
        
            <div className="bg-blue-50 rounded-lg p-6 md:p-10 flex-1">
              <h2 className="text-xs md:text-lg font-semibold text-gray-800 mb-3 md:mb-6">
                연구대상: 아래 조건을 충족하는 간호사
              </h2>
              <ul className="text-gray-500 space-y-3 md:space-y-4 text-left text-[11px] md:text-base">
                <li className="pb-2">• 상급종합병원과 종합병원에서 <br className="md:hidden"/>2025년 10-11월에 교대근무한 일반간호사</li>
                <li className="pb-2">• 일반병동, 간호간병통합서비스 병동, 중환자실 대상<br className="md:hidden"/>
                  <span >(응급실, 수술실, 기타 부서 제외)</span></li>
                <li className="pb-2">• 간호관리자(수간호사 등)와<br className="md:hidden"/> 10-11월에 OT받은 신입간호사 제외</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleStartSurvey}
            disabled={isNavigating}
            className={`group inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-all duration-300 text-sm md:text-lg transform hover:scale-105 active:scale-95 ${
              isNavigating 
                ? 'opacity-75 cursor-not-allowed scale-95' 
                : 'hover:shadow-lg animate-pulse hover:animate-none'
            }`}
          >
            <span className="flex items-center gap-1">
              {isNavigating ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  이동 중...
                </>
              ) : (
                <>
                  설문조사 시작하기
                  <svg className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </span>
          </button>
          
       
        </div>
      </div>
    </div>
  )
}