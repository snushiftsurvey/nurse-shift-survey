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
                안녕하세요? <br/><br/>본 설문으로 교대근무 간호사의 2개월간 근무표를 수집하여 근무시간의 질을 평가하고, 
                이를 바탕으로 간호사 근무시간 질 평가 애플리케이션을 개발하기 위한 목적으로 진행됩니다.
              </p>
              
              <p>
                설문 소요 시간은 약 20분이며, 참여해 주신 분들께는 감사의 표시로 모바일 기프트콘을 
                제공할 예정입니다.
              </p>
              
              <p>
                답례 제공을 위하여 성명, 생년월일, 휴대전화번호 등 개인정보를 수집하나, 
                이는 사례 지급을 위한 행정 처리에만 사용되며 지급 이후 즉시 폐기됩니다.
              </p>
              
              <p>
                설문을 통해 수집되는 정보는 개인을 식별할 수 없는 형태로 관리되며, 
                연구 참여자는 언제든지 어떠한 불이익 없이 참여를 중단할 수 있습니다.
              </p>
              
              <p>
                본 연구는 교대근무 간호사의 근무환경 개선을 위한 중요한 기초자료로 활용될 예정이오니, 
                연구의 원활한 수행을 위하여 적극적인 참여를 부탁드립니다. 감사합니다.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-left text-blue-600 font-medium text-sm md:text-base">
                서울대학교 간호대학 조성현 교수 연구팀 드림
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Link 
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              이전
            </Link>
            
            <Link 
              href="/survey/consent"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              다음
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
