'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSurvey } from '@/hooks/useSurvey'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { supabasePublic } from '@/lib/supabase'

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
    question: '5. 지난 10-11월에 독립적으로 환자를 간호했나요? (예: 신입간호사 OT기간 → 아니요)',
    options: [
      { value: 'yes', label: '예', isEligible: true },
      { value: 'no', label: '아니요', isEligible: false },
    ]
  }
]

export default function EligibilityPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [departmentLimits, setDepartmentLimits] = useState<Record<string, {current: number, limit: number}>>({})
  const [limitsLoaded, setLimitsLoaded] = useState(false)
  const { updateSurveyData } = useSurvey()
  const router = useRouter()
  const isAccessible = useProtectedRoute()

  // 2번에서 3번 문항으로 넘어갈 때 부서별 제한과 통계 미리 로드
  useEffect(() => {
    const isMovingToDepartmentQuestion = currentQuestionIndex === 2 // 3번째 문항 (0-based index)
    if (isMovingToDepartmentQuestion && !limitsLoaded) {
  
      loadDepartmentLimits()
    }
  }, [currentQuestionIndex, limitsLoaded])

  // 3번 문항 접근 시 모든 부서별 제한과 현재 통계 미리 로드
  const loadDepartmentLimits = async () => {
    try {

      
      // 1. 모든 부서별 제한 설정 조회
      const { data: limitsData, error: limitsError } = await supabasePublic
        .from('survey_limits')
        .select('setting_name, setting_value, department')
        .in('setting_name', ['general_ward_limit', 'integrated_care_ward_limit', 'icu_limit'])
      
      if (limitsError) {
        return
      }

      // 2. 모든 부서별 현재 응답 수 조회 (영문과 한글 모두 확인)
      const { data: statsData, error: statsError } = await supabasePublic
        .from('surveys')
        .select('department')
        .in('department', ['general-ward', 'integrated-care-ward', 'icu', '일반병동', '간호·간병통합서비스 병동', '중환자실'])
      
      if (statsError) {
        return
      }

      // 3. 통계 계산 (영문/한글 모두 카운트)
      const stats = {
        'general-ward': (statsData?.filter(s => s.department === 'general-ward' || s.department === '일반병동').length || 0),
        'integrated-care-ward': (statsData?.filter(s => s.department === 'integrated-care-ward' || s.department === '간호·간병통합서비스 병동').length || 0),
        'icu': (statsData?.filter(s => s.department === 'icu' || s.department === '중환자실').length || 0)
      }

      // 4. 제한과 통계 매핑
      const limits: Record<string, {current: number, limit: number}> = {}
      
      limitsData?.forEach(limitItem => {
        if (limitItem.department) {
          limits[limitItem.department] = {
            current: stats[limitItem.department as keyof typeof stats],
            limit: limitItem.setting_value
          }
        }
      })


      setDepartmentLimits(limits)
      setLimitsLoaded(true)
      
    } catch (error) {
      // 오류 발생 시 조용히 처리
    }
  }

  // 사용자 선택 시 즉시 제한 확인
  const checkSelectedDepartment = (selectedDepartment: string) => {
    const deptData = departmentLimits[selectedDepartment]
    if (!deptData) {
      return true
    }
    
    if (deptData.current >= deptData.limit) {
      const deptName = selectedDepartment === 'general-ward' ? '일반병동' :
        selectedDepartment === 'integrated-care-ward' ? '간호·간병통합서비스 병동' :
        selectedDepartment === 'icu' ? '중환자실' : selectedDepartment
      
      alert(`가능한 설문응답이 종료되었습니다\n(사유: ${deptName} 응답자 수 초과)`)
      router.push('/')
      return false
    }

    return true
  }

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

  const handleAnswer = async (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    
    // 부서 선택 시 즉시 제한 확인
    if (currentQuestion.id === 'department') {
      const isAllowed = checkSelectedDepartment(value)
      if (!isAllowed) {
        return // 제한 초과 시 선택 차단
      }
    }
    
    setAnswers(newAnswers)
    
    const selectedOption = currentQuestion.options.find(opt => opt.value === value)
    
    if (!selectedOption?.isEligible) {
      alert('연구대상에 해당되지 않아 설문이 종료됩니다. 감사합니다.')
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

  const handleNext = async () => {
    const currentAnswer = answers[currentQuestion.id]
    
    if (!currentAnswer) {
      alert('질문에 답변해주세요.')
      return
    }
    
    const selectedOption = currentQuestion.options.find(opt => opt.value === currentAnswer)
    
    if (!selectedOption?.isEligible) {
      alert('연구대상에 해당되지 않아 설문이 종료됩니다. 감사합니다.')
      router.push('/')
      return
    }

    if (isLastQuestion) {
      // 마지막 문항에서 한 번 더 부서 제한 확인
      if (answers.department) {
        const isAllowed = checkSelectedDepartment(answers.department)
        if (!isAllowed) {
          return // 제한 초과 시 진행 차단
        }
      }
      
      // 모든 답변을 surveyData에 저장
      updateSurveyData({
        medicalInstitutionType: answers.medicalInstitutionType as 'tertiary' | 'general' | 'hospital' | 'other',
        medicalInstitutionLocation: answers.medicalInstitutionLocation,
        department: answers.department,
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
                {currentQuestion.question.includes('(예:') 
                  ? currentQuestion.question.split('(예:')[0].trim()
                  : currentQuestion.question
                }
              </h2>
              {currentQuestion.question.includes('(예:') && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  (예: {currentQuestion.question.split('(예:')[1].replace(')', '').trim()})
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

          <div className="space-y-3">
            {/* 안내 텍스트 */}
            <div className="text-xs sm:text-sm text-gray-500 text-center">
              선택하시면 자동으로 다음 단계로 진행됩니다
            </div>
            
            {/* 버튼들 */}
            <div className="flex flex-row justify-between items-center gap-4">
              <button
                onClick={handlePrevious}
                className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base flex-shrink-0"
              >
                이전
              </button>
              
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base flex-shrink-0"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
