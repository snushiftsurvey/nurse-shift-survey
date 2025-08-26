'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSurvey } from '@/hooks/useSurvey'
import { WorkType, OffDutyType, ShiftData } from '@/lib/types'
import WorkTypesTable from '@/components/survey/WorkTypesTable'
import OffDutyTypesTable from '@/components/survey/OffDutyTypesTable'
import CalendarTable from '@/components/survey/CalendarTable'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'

export default function DemographicsPage() {
  // ✅ 모든 Hook을 최상위에서 호출 (조건부 return 이전에)
  const [currentStep, setCurrentStep] = useState(1)
  const { state, updateSurveyData } = useSurvey()
  const router = useRouter()
  const isAccessible = useProtectedRoute()

  // 폼 데이터 상태 (조건부 return 이전에 모든 Hook 호출)
  const [formData, setFormData] = useState({
    gender: state.surveyData.gender || '',
    age: state.surveyData.age || '',
    hireYear: state.surveyData.hireYear || '2025',
    hireMonth: state.surveyData.hireMonth || '3'
  })

    // 빈 근무유형으로 시작 (사용자가 직접 입력)
  const [workTypes, setWorkTypes] = useState<WorkType[]>(() => {
    // 세션 저장 안함 - 항상 빈 칸으로 시작
    // WorkTypesTable의 addWorkType과 동일한 로직 사용
    const newWorkType: WorkType = {
      id: (Date.now() + Math.random()).toString(), // ID 중복 방지
      name: '',
      startTime: '09:00',
      endTime: '18:00',
      breakTime: 'custom',
      customBreakTime: ''
    }
    return [newWorkType]
  })
  
  // 빈 휴무유형으로 시작 (사용자가 직접 입력)
  const [offDutyTypes, setOffDutyTypes] = useState<OffDutyType[]>(() => {
    // 세션 저장 안함 - 항상 빈 칸 1개로 시작
    return [
      {
        id: Date.now().toString(),
        name: ''
      }
    ]
  })
  
  const [shiftData, setShiftData] = useState<ShiftData>(() => {
    if (state.surveyData.shiftData && Object.keys(state.surveyData.shiftData).length > 0) {
      return state.surveyData.shiftData
    }
    
    // 빈 근무표로 시작 (사용자가 직접 선택하도록)
    return {}
  })

  // ✅ 조건부 렌더링을 Hook 호출 이후에 처리
  // 설문이 시작되지 않았으면 빈 화면 표시 (리다이렉트 진행 중)
  if (!isAccessible) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>
  }

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleShiftChange = (date: string, workTypeId: string) => {
    setShiftData(prev => ({
      ...prev,
      [date]: workTypeId
    }))
  }

  // 필드 유효성 검사 (시각적 피드백용)
  const isFieldValid = (field: string) => {
    switch (field) {
      case 'gender':
        return formData.gender && String(formData.gender).trim() !== ''
      case 'age':
        return formData.age && String(formData.age).trim() !== '' && Number(formData.age) > 0
      case 'hireYear':
        return formData.hireYear && String(formData.hireYear).trim() !== ''
      case 'hireMonth':
        return formData.hireMonth && String(formData.hireMonth).trim() !== ''
      default:
        return true
    }
  }

  // 필드 에러 스타일 클래스
  const getFieldErrorClass = (field: string) => {
    if (currentStep === 1 && !isFieldValid(field)) {
      return 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
    }
    return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        // 일반적 특성 3개 필드 모두 필수: 성별, 연령, 입사연월
        return (
          formData.gender && String(formData.gender).trim() !== '' &&
          formData.age && String(formData.age).trim() !== '' && Number(formData.age) > 0 &&
          formData.hireYear && String(formData.hireYear).trim() !== '' &&
          formData.hireMonth && String(formData.hireMonth).trim() !== ''
        )
      case 2:
        return workTypes.length > 0 && 
               workTypes.every(wt => wt.name.trim() !== '')
               // 휴무유형은 선택사항이므로 검증에서 제외
      case 3:
        // 2개월 모든 날짜에 유효한 근무유형/휴무유형이 선택되었는지 확인
        const october2025Days = Array.from({length: 31}, (_, i) => `2025-10-${(i + 1).toString().padStart(2, '0')}`)
        const november2025Days = Array.from({length: 30}, (_, i) => `2025-11-${(i + 1).toString().padStart(2, '0')}`)
        const allDays = [...october2025Days, ...november2025Days]
        
        // 모든 유효한 ID 목록 생성
        const validIds = [
          ...workTypes.filter(wt => wt.name.trim() !== '').map(wt => wt.id),
          ...offDutyTypes.filter(ot => ot.name.trim() !== '').map(ot => ot.id)
        ]
        
        // 모든 날짜에 유효한 ID가 선택되었는지 확인
        return allDays.every(date => {
          const selectedId = shiftData[date]
          return selectedId && selectedId.trim() !== '' && validIds.includes(selectedId)
        })
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canProceedToNext()) {
      // 어떤 단계에서 문제가 있는지 구체적인 메시지 제공
      if (currentStep === 1) {
        const missingFields = []
        if (!formData.gender || String(formData.gender).trim() === '') missingFields.push('성별')
        if (!formData.age || String(formData.age).trim() === '' || Number(formData.age) <= 0) missingFields.push('연령')
        if (!formData.hireYear || String(formData.hireYear).trim() === '') missingFields.push('입사연도')
        if (!formData.hireMonth || String(formData.hireMonth).trim() === '') missingFields.push('입사월')
        
        if (missingFields.length > 0) {
          alert(`다음 필수 항목을 입력해주세요:\n• ${missingFields.join('\n• ')}`)
        } else {
          alert('모든 필수 항목(성별, 연령, 입사연월)을 올바르게 입력해주세요.')
        }
      } else if (currentStep === 2) {
        alert('모든 근무유형의 이름을 입력해주세요.')
      } else if (currentStep === 3) {
        // 3단계에서는 더 상세한 검증 메시지 제공
        const october2025Days = Array.from({length: 31}, (_, i) => `2025-10-${(i + 1).toString().padStart(2, '0')}`)
        const november2025Days = Array.from({length: 30}, (_, i) => `2025-11-${(i + 1).toString().padStart(2, '0')}`)
        const allDays = [...october2025Days, ...november2025Days]
        
        const validIds = [
          ...workTypes.filter(wt => wt.name.trim() !== '').map(wt => wt.id),
          ...offDutyTypes.filter(ot => ot.name.trim() !== '').map(ot => ot.id)
        ]
        
        const incompleteDays = allDays.filter(date => {
          const selectedId = shiftData[date]
          return !selectedId || selectedId.trim() === '' || !validIds.includes(selectedId)
        })
        
        if (incompleteDays.length > 0) {
          const sampleDates = incompleteDays.slice(0, 3).map(date => {
            const [year, month, day] = date.split('-')
            return `${month}월 ${parseInt(day)}일`
          }).join(', ')
          
          const moreText = incompleteDays.length > 3 ? ` 외 ${incompleteDays.length - 3}일` : ''
          
          alert(`⚠️ 근무표가 완성되지 않았습니다!\n\n미완성 날짜: ${sampleDates}${moreText}\n\n모든 날짜(총 ${allDays.length}일)에 근무유형 또는 휴무유형을 반드시 선택해주세요.`)
          return
        }
      }
      return
    }

    if (currentStep < 3) {
      // 현재 단계 데이터 저장
      if (currentStep === 1) {
        updateSurveyData({
          gender: formData.gender as 'female' | 'male',
          age: Number(formData.age),
          hireYear: Number(formData.hireYear),
          hireMonth: Number(formData.hireMonth)
        })
      } else if (currentStep === 2) {
        updateSurveyData({ workTypes, offDutyTypes })
      }
      
      setCurrentStep(currentStep + 1)
    } else {
      // 최종 단계에서 모든 데이터 저장하기 전 한 번 더 검증
      const october2025Days = Array.from({length: 31}, (_, i) => `2025-10-${(i + 1).toString().padStart(2, '0')}`)
      const november2025Days = Array.from({length: 30}, (_, i) => `2025-11-${(i + 1).toString().padStart(2, '0')}`)
      const allDays = [...october2025Days, ...november2025Days]
      
      const validIds = [
        ...workTypes.filter(wt => wt.name.trim() !== '').map(wt => wt.id),
        ...offDutyTypes.filter(ot => ot.name.trim() !== '').map(ot => ot.id)
      ]
      
      const completedDays = allDays.filter(date => {
        const selectedId = shiftData[date]
        return selectedId && selectedId.trim() !== '' && validIds.includes(selectedId)
      }).length
      
      // 최종 확인 메시지
      const confirmMessage = `🗓️ 근무표 최종 확인\n\n총 ${allDays.length}일 중 ${completedDays}일 완성\n✅ 모든 날짜에 근무/휴무가 선택되었습니다.\n\n이대로 제출하시겠습니까?`
      
      if (completedDays === allDays.length && confirm(confirmMessage)) {
        // 최종 단계에서 모든 데이터 저장
        updateSurveyData({
          gender: formData.gender as 'female' | 'male',
          age: Number(formData.age),
          hireYear: Number(formData.hireYear),
          hireMonth: Number(formData.hireMonth),
          workTypes,
          offDutyTypes,
          shiftData
        })
        router.push('/survey/personal-info')
      } else if (completedDays !== allDays.length) {
        alert('⚠️ 오류: 모든 날짜가 완성되지 않았습니다. 다시 확인해주세요.')
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push('/survey/eligibility')
    }
  }

  // 자동 채우기 비활성화 - 사용자가 명시적으로 "모든 날짜 채우기" 버튼을 클릭해야 함

  // 빠른 채우기 함수 (개발 테스트용)
  const fillAllDatesWithFirstWorkType = () => {
    const validWorkTypes = workTypes.filter(wt => wt.name.trim() !== '')
    if (validWorkTypes.length > 0) {
      const firstWorkTypeId = validWorkTypes[0].id
      const october2025Days = Array.from({length: 31}, (_, i) => `2025-10-${(i + 1).toString().padStart(2, '0')}`)
      const november2025Days = Array.from({length: 30}, (_, i) => `2025-11-${(i + 1).toString().padStart(2, '0')}`)
      const allDays = [...october2025Days, ...november2025Days]
      
      const newShiftData: { [key: string]: string } = {}
      allDays.forEach(date => {
        newShiftData[date] = firstWorkTypeId
      })
      
      setShiftData(newShiftData)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              일반적 특성 및 근무표
            </h1>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-4/6"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">4단계 / 6단계</p>
          </div>

          <div className="mb-6">
            <div className="flex space-x-2 sm:space-x-4 mb-8">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    step === currentStep
                      ? 'bg-blue-600 text-white'
                      : step < currentStep
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step === 1 && '일반적 특성'}
                  {step === 2 && '근무유형 정의'}
                  {step === 3 && '근무표 입력'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  일반적 특성
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      성별 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="female" 
                          checked={formData.gender === 'female'}
                          onChange={(e) => handleFormDataChange('gender', e.target.value)}
                          className="mr-2"
                          autoComplete="off"
                        />
                        여성
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="male" 
                          checked={formData.gender === 'male'}
                          onChange={(e) => handleFormDataChange('gender', e.target.value)}
                          className="mr-2"
                          autoComplete="off"
                        />
                        남성
                      </label>
                    </div>
                    {currentStep === 1 && !isFieldValid('gender') && (
                      <p className="mt-1 text-sm text-red-600">성별을 선택해주세요</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연령 (만 나이) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      value={formData.age}
                      onChange={(e) => handleFormDataChange('age', e.target.value)}
                      className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 text-gray-900 ${getFieldErrorClass('age')}`}
                      placeholder="예: 28"
                      autoComplete="off"
                      autoFocus={false}
                      style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                    />
                    {currentStep === 1 && !isFieldValid('age') && (
                      <p className="mt-1 text-sm text-red-600">연령을 입력해주세요</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      입사연월 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <select 
                        value={formData.hireYear}
                        onChange={(e) => handleFormDataChange('hireYear', e.target.value)}
                        className={`px-3 py-2 border rounded-lg focus:ring-2 text-gray-900 ${getFieldErrorClass('hireYear')}`}
                        autoComplete="off"
                        style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                      >
                        <option value="">년도 선택</option>
                        {Array.from({length: 30}, (_, i) => 2025 - i).map(year => (
                          <option key={year} value={year}>{year}년</option>
                        ))}
                      </select>
                      <select 
                        value={formData.hireMonth}
                        onChange={(e) => handleFormDataChange('hireMonth', e.target.value)}
                        className={`px-3 py-2 border rounded-lg focus:ring-2 text-gray-900 ${getFieldErrorClass('hireMonth')}`}
                        autoComplete="off"
                        style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                      >
                        <option value="">월 선택</option>
                        {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                          <option key={month} value={month}>{month}월</option>
                        ))}
                      </select>
                    </div>
                    {currentStep === 1 && (!isFieldValid('hireYear') || !isFieldValid('hireMonth')) && (
                      <p className="mt-1 text-sm text-red-600">입사연월을 모두 선택해주세요</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    근무/휴무 유형 정의
                  </h2>
                  
                  {/* 근무유형 정의 섹션 */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      근무 유형 정의
                    </h3>
                    <WorkTypesTable workTypes={workTypes} onChange={setWorkTypes} />
                  </div>

                  {/* 휴무유형 정의 섹션 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      휴무 유형 정의 (선택사항)
                    </h3>
                    <OffDutyTypesTable offDutyTypes={offDutyTypes} onChange={setOffDutyTypes} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    근무표 입력
                  </h2>
                  <p className="text-gray-600 mb-4">
                    앞서 정의한 근무유형을 바탕으로 2개월간의 근무표를 입력해주세요.
                  </p>
                  
                  {/* 진행률 표시 */}
                  {(() => {
                    const october2025Days = Array.from({length: 31}, (_, i) => `2025-10-${(i + 1).toString().padStart(2, '0')}`)
                    const november2025Days = Array.from({length: 30}, (_, i) => `2025-11-${(i + 1).toString().padStart(2, '0')}`)
                    const allDays = [...october2025Days, ...november2025Days]
                    const totalDays = allDays.length
                    
                    const validIds = [
                      ...workTypes.filter(wt => wt.name.trim() !== '').map(wt => wt.id),
                      ...offDutyTypes.filter(ot => ot.name.trim() !== '').map(ot => ot.id)
                    ]
                    
                    const completedDays = allDays.filter(date => {
                      const selectedId = shiftData[date]
                      return selectedId && selectedId.trim() !== '' && validIds.includes(selectedId)
                    }).length
                    
                    const progressPercentage = (completedDays / totalDays) * 100
                    const isComplete = completedDays === totalDays
                    
                    return (
                      <div className={`border rounded-lg p-4 mb-6 ${isComplete ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${isComplete ? 'text-green-800' : 'text-orange-800'}`}>
                            근무표 완성도
                          </span>
                          <span className={`text-sm font-bold ${isComplete ? 'text-green-800' : 'text-orange-800'}`}>
                            {completedDays} / {totalDays}일 ({Math.round(progressPercentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className={`mt-2 text-xs ${isComplete ? 'text-green-700' : 'text-orange-700'}`}>
                          {isComplete ? (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                              </svg>
                              모든 날짜에 근무/휴무가 완성되었습니다!
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                              </svg>
                              아직 {totalDays - completedDays}일이 미완성 상태입니다. 모든 날짜를 완성해주세요.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* 개발 테스트용 빠른 채우기 버튼 */}
                {(() => {
                  const validWorkTypes = workTypes.filter(wt => wt.name.trim() !== '')
                  if (validWorkTypes.length > 0) {
                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">개발 테스트 도구</h4>
                            <p className="text-xs text-yellow-700 mt-1">
                              모든 날짜를 "{validWorkTypes[0].name}" 근무유형으로 한 번에 채웁니다
                            </p>
                          </div>
                          <button
                            onClick={fillAllDatesWithFirstWorkType}
                            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            🚀 모든 날짜 채우기
                          </button>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                <CalendarTable
                  workTypes={workTypes}
                  offDutyTypes={offDutyTypes}
                  shiftData={shiftData}
                  onChange={handleShiftChange}
                />
              </div>
            )}
          </div>

          <div className="flex flex-row justify-between items-center gap-4">
            <button
              onClick={handlePrevious}
              className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base flex-shrink-0"
            >
              이전
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base flex-shrink-0 ${
                !canProceedToNext() 
                  ? 'bg-gray-300 text-gray-500 disabled:opacity-50'
                  : currentStep === 3
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={!canProceedToNext() && currentStep === 1 ? '모든 필수 항목을 입력해주세요' : ''}
            >
              {currentStep === 3 ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  근무표 제출하기
                </span>
              ) : '계속'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
