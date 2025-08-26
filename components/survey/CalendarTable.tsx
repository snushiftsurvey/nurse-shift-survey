'use client'

import React from 'react'
import { WorkType, OffDutyType, ShiftData } from '@/lib/types'

interface CalendarTableProps {
  workTypes: WorkType[]
  offDutyTypes: OffDutyType[]
  shiftData: ShiftData
  onChange: (date: string, workTypeId: string) => void
}

export default function CalendarTable({ workTypes, offDutyTypes, shiftData, onChange }: CalendarTableProps) {
  // 2025년 10월, 11월 날짜 정보
  const october2025Days = 31
  const november2025Days = 30
  
  // 날짜 변경 처리 - 빈 값도 허용
  const handleDateChange = (date: string, value: string) => {
    // 선택된 값을 그대로 전달 (빈 값 포함)
    onChange(date, value)
  }

  // 날짜 키 생성 (YYYY-MM-DD 형식)
  const getDateKey = (month: number, day: number) => {
    return `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  // 근무유형 옵션 텍스트 생성 (시간 정보 포함)
  const getWorkTypeDisplayText = (workType: WorkType) => {
    let timeText = `${workType.startTime}~${workType.endTime}`
    let breakText = ''
    
    if (workType.customBreakTime && workType.customBreakTime.trim() !== '') {
      breakText = `,휴게 ${workType.customBreakTime}`
    }
    
    return `${workType.name}(${timeText}${breakText})`
  }

  // 빈 이름을 가진 유형들 필터링
  const validWorkTypes = workTypes.filter(wt => wt.name.trim() !== '')
  const validOffDutyTypes = offDutyTypes.filter(ot => ot.name.trim() !== '')

  // 첫 번째 근무유형으로 기본값 설정 (자동 선택)
  const getDefaultWorkType = () => {
    return validWorkTypes.length > 0 ? validWorkTypes[0].id : ''
  }

  // 선택 옵션 렌더링
  const renderSelectOptions = () => (
    <>
      {/* 기본 선택 옵션 */}
      <option value="">선택</option>
      
      {/* 휴무유형들 */}
      {validOffDutyTypes.map(offDutyType => (
        <option key={offDutyType.id} value={offDutyType.id}>
          {offDutyType.name}
        </option>
      ))}
      
      {/* 근무유형들 */}
      {validWorkTypes.map(workType => (
        <option key={workType.id} value={workType.id}>
          {getWorkTypeDisplayText(workType)}
        </option>
      ))}
    </>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          2025년 10-11월 근무표
        </h3>
        {validWorkTypes.length === 0 && (
          <p className="text-sm text-red-600">
            먼저 근무유형을 정의해주세요
          </p>
        )}
      </div>

      {validWorkTypes.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <span className="text-yellow-800 font-medium">근무유형 정의 필요</span>
          </div>
          <p className="text-yellow-700 text-sm">
            근무표를 입력하려면 먼저 <strong>2단계: 근무유형 정의</strong>에서<br/>
            근무유형의 이름과 시간을 입력해주세요.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="bg-gray-50 grid border-b border-gray-200" style={{ gridTemplateColumns: '50px 1fr 1fr' }}>
            <div className="p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm font-medium text-gray-700 border-r border-gray-200">
              날짜
            </div>
            <div className="p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm font-medium text-gray-700 border-r border-gray-200">
              2025년 10월
            </div>
            <div className="p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm font-medium text-gray-700">
              2025년 11월
            </div>
          </div>

          {/* 테이블 본문 */}
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 31 }, (_, index) => {
              const day = index + 1
              const octoberDateKey = getDateKey(10, day)
              const novemberDateKey = getDateKey(11, day)
                              const selectedOctoberWorkType = shiftData[octoberDateKey]
                const selectedNovemberWorkType = shiftData[novemberDateKey]
                const hasNovemberDay = day <= november2025Days

              return (
                <div key={day} className="grid min-h-[60px] md:min-h-[50px]" style={{ gridTemplateColumns: '50px 1fr 1fr' }}>
                  {/* 날짜 */}
                  <div className="p-1 sm:p-2 md:p-3 border-r border-gray-200 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {day}일
                    </span>
                  </div>

                  {/* 10월 */}
                  <div className="p-1 sm:p-2 border-r border-gray-200 flex items-center">
                    <select
                      key={`october-${day}`}
                      value={(() => {
                        const currentValue = selectedOctoberWorkType || ''
                        // 현재 값이 유효한 옵션인지 확인
                        const allValidIds = [
                          ...validWorkTypes.map(wt => wt.id),
                          ...validOffDutyTypes.map(ot => ot.id)
                        ]
                        return allValidIds.includes(currentValue) ? currentValue : ''
                      })()}
                      onChange={(e) => handleDateChange(octoberDateKey, e.target.value)}
                      className={`w-full text-xs md:text-sm border rounded px-1 py-0.5 sm:py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 ${
                        selectedOctoberWorkType && selectedOctoberWorkType.trim() !== ''
                          ? 'border-blue-300 bg-blue-50 text-blue-900 font-medium' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                    >
                      {renderSelectOptions()}
                    </select>
                  </div>

                                    {/* 11월 */}
                  <div className="p-1 sm:p-2 flex items-center">
                    {hasNovemberDay ? (
                      <select
                        key={`november-${day}`}
                        value={(() => {
                          const currentValue = selectedNovemberWorkType || ''
                          // 현재 값이 유효한 옵션인지 확인
                          const allValidIds = [
                            ...validWorkTypes.map(wt => wt.id),
                            ...validOffDutyTypes.map(ot => ot.id)
                          ]
                          return allValidIds.includes(currentValue) ? currentValue : ''
                        })()}
                        onChange={(e) => handleDateChange(novemberDateKey, e.target.value)}
                        className={`w-full text-xs md:text-sm border rounded px-1 py-0.5 sm:py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 ${
                          selectedNovemberWorkType && selectedNovemberWorkType.trim() !== ''
                            ? 'border-blue-300 bg-blue-50 text-blue-900 font-medium'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                      >
                        {renderSelectOptions()}
                      </select>
                    ) : (
                      <div className="w-full text-center text-gray-400 text-xs">
                        -
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
