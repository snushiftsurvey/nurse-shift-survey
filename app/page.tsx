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
    console.log('🔒 설문 시작 - 설문 수 제한 확인')
    
    try {
      setIsNavigating(true)
      
      // 1. 설문 응답 수 제한 확인 (350개)
      const { count, error } = await supabasePublic
        .from('surveys')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error('❌ 설문 수 확인 실패:', error)
        alert('설문 시작 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        setIsNavigating(false)
        return
      }
      
      if (count && count >= 350) {
        alert('가능한 설문응답이 종료되었습니다\n(사유: 응답자 수 초과)')
        setIsNavigating(false)
        return
      }
      
      console.log(`📊 현재 설문 수: ${count}/350 - 설문 시작 가능`)
      console.log('🔒 설문 시작 - 모든 데이터 완전 초기화')
      
      // 2. 강제 전체 초기화
      forceClearAll()
      
      // 3. 설문 시작 상태 설정
      startSurvey()
      
      // 4. 페이지 이동
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
       
            <p className="text-xs md:text-lg font-medium leading-tight">
              교대근무 간호사 2개월 근무표 수집 연구
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-6 mb-6 md:mb-10">
            <Image
              src="/images/icons/speakers.png"
              alt="안내"
              width={120}
              height={120}
              className="w-20 h-20 md:w-32 md:h-32 lg:w-32 lg:h-32 flex-shrink-0"
            />
            <div className="bg-blue-50 rounded-lg p-2 md:p-6 flex-1">
              <h2 className="text-sm md:text-lg font-semibold text-gray-800 mb-2 md:mb-4">
                설문 참여 안내
              </h2>
              <ul className="text-gray-500 space-y-1 md:space-y-2 text-left text-[13px] md:text-base">
                <li>• 소요시간: 약 20분</li>
                <li>• 답례품: 5,000원 상당 모바일 기프티콘</li>
                <li>• 개인정보는 답례품 지급 후 즉시 폐기</li>
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