'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSurvey } from '@/hooks/useSurvey'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'

const questions = [
  {
    id: 'medicalInstitutionType',
    question: '1. 현재 어느 의료기관에 근무하십니까?',
    options: [
      { value: 'tertiary', label: '상급종합병원', isEligible: true },
      { value: 'general', label: '종합병원', isEligible: true },
      { value: 'hospital', label: '병원', isEligible: false },
      { value: 'other', label: '기타', isEligible: false },
    ]
  },
  {
    id: 'medicalInstitutionLocation',
    question: '2. 근무 중인 의료기관의 소재지는 어디입니까?',
    options: [
      { value: 'seoul', label: '서울', isEligible: true },
      { value: 'incheon-gyeonggi', label: '인천, 경기', isEligible: true },
      { value: 'daejeon-sejong-chungcheong', label: '대전, 세종, 충북, 충남', isEligible: true },
      { value: 'gangwon', label: '강원', isEligible: true },
      { value: 'gwangju-jeolla', label: '광주, 전북, 전남', isEligible: true },
      { value: 'busan-daegu-gyeongsang', label: '부산, 대구, 울산, 경북, 경남', isEligible: true },
      { value: 'jeju', label: '제주', isEligible: true },
    ]
  },
  {
    id: 'department',
    question: '3. 지난 11월에 어느 부서에서 근무하셨습니까?',
    options: [
      { value: 'general-ward', label: '일반병동', isEligible: true },
      { value: 'integrated-care-ward', label: '간호·간병통합서비스 병동', isEligible: true },
      { value: 'icu', label: '중환자실', isEligible: true },
      { value: 'emergency', label: '응급실', isEligible: false },
      { value: 'operating-room', label: '수술실', isEligible: false },
      { value: 'other', label: '기타', isEligible: false },
    ]
  },
  {
    id: 'isManager',
    question: '4. 지난 10-11월에 간호관리자(수간호사, UM, 파트장 등)로 근무하셨습니까? ',
    options: [
      { value: 'yes', label: '예', isEligible: false },
      { value: 'no', label: '아니요', isEligible: true },
    ]
  },
  {
    id: 'independentCare',
    question: '5. 지난 10-11월에 독립적으로 환자를 간호했나요? (예시: 신입간호사 교육기간으로 독립적으로 환자를 간호하지 않은 경우 ‘아니요’에 해당)',
    options: [
      { value: 'yes', label: '예', isEligible: true },
      { value: 'no', label: '아니요', isEligible: false },
    ]
  }
]

export default function EligibilityPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const { updateSurveyData } = useSurvey()
  const router = useRouter()
  const isAccessible = useProtectedRoute()

  // 설문이 시작되지 않았으면 빈 화면 표시 (리다이렉트 진행 중)
  if (!isAccessible) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)
    
    const selectedOption = currentQuestion.options.find(opt => opt.value === value)
    
    if (!selectedOption?.isEligible) {
      alert('연구대상’에 해당되지 않아 설문이 종료됩니다. 감사합니다.')
      router.push('/')
      return
    }

    if (isLastQuestion) {
      // 모든 답변을 surveyData에 저장
      updateSurveyData({
        medicalInstitutionType: newAnswers.medicalInstitutionType as 'tertiary' | 'general' | 'hospital' | 'other',
        medicalInstitutionLocation: newAnswers.medicalInstitutionLocation,
        department: newAnswers.department,
      })
      router.push('/survey/demographics')
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else {
      router.push('/survey/consent')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              연구 대상 확인 질문
            </h1>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-3/6"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">3단계 / 6단계</p>
          </div>

          <div className="mb-8">
            <div className="mb-4">
              <span className="text-sm text-gray-500">
                질문 {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentQuestion.question.includes('(예시:') 
                  ? currentQuestion.question.split('(예시:')[0].trim()
                  : currentQuestion.question
                }
              </h2>
              {currentQuestion.question.includes('(예시:') && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  (예시: {currentQuestion.question.split('(예시:')[1].replace(')', '').trim()})
                </p>
              )}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={answers[currentQuestion.id] === option.value}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="mr-4 h-4 w-4 text-blue-600"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
            
            <div className="text-sm text-gray-500">
              선택하시면 자동으로 다음 단계로 진행됩니다
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
