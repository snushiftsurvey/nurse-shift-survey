'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useSurvey } from '@/hooks/useSurvey'

export default function SurveyIntroPage() {
  const { startSurvey } = useSurvey()

  useEffect(() => {
    // 설문 페이지에 접근하면 설문 시작 플래그 설정
    startSurvey()
  }, [startSurvey]) // useCallback으로 메모이제이션된 함수이므로 안전함
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-4">
              연구 설명
            </h1>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-1/6"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">1단계 / 6단계</p>
          </div>

          <div className="prose prose-lg max-w-none mb-8">
            <div className="space-y-4 text-gray-700 leading-relaxed text-sm md:text-lg">
              <p>
                안녕하십니까? <br/><br/>본 설문은 교대근무 간호사의 2개월간 근무표를 수집하여 근무시간의 질을 평가하고, 
                이를 바탕으로 간호사 근무시간 질 평가 애플리케이션을 개발하기 위한 목적으로 진행됩니다. 
                설문은 온라인으로 진행되며, 응답에 약 20분이 소요될 것으로 예상됩니다. 
              </p>
              <br/>
              <p>
              설문을 완료하신 모든 분께는 감사의 뜻으로 소정의 사례가 제공될 것입니다. 
              답례 제공을 위해 동의하시는 경우 귀하의 개인정보(성명, 생년월일, 휴대전화번호)를 수집하며,
               이는 사례 지급을 위한 행정처리에만 사용되고 행정처리 완료 즉시 폐기됩니다. 
               귀하는 언제든지 어떠한 불이익 없이 설문 참여를 중단할 수 있고,
               설문에 대한 응답은 본 연구목적 이외에는 사용되지 않을 것입니다.
              </p>
              
              <p>
              본 연구는 교대근무 간호사의 근무환경 개선을 위한 중요한 기초자료로 활용될 예정이오니, 
              적극적인 참여를 부탁드립니다. 감사합니다.
              </p>
              
  
            </div>

            <div className="mt-6">
              <p className="text-left text-blue-600 font-medium text-sm md:text-base">
                서울대학교 간호대학 조성현 교수 연구팀 드림
              </p>
            </div>
          </div>

          <div className="flex flex-row justify-between items-center gap-4">
            <Link 
              href="/"
              className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base flex-shrink-0"
            >
              이전
            </Link>
            
            <Link 
              href="/survey/consent"
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base flex-shrink-0"
            >
              다음
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
