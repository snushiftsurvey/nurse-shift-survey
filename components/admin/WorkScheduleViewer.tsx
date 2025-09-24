'use client'

import React from 'react'

interface WorkType {
  id: string
  name: string
  startTime: string
  endTime: string
  breakTime: string
  customBreakTime?: string
}

interface OffDutyType {
  id: string
  name: string
}

interface ShiftData {
  [date: string]: string
}

interface PersonalInfo {
  name: string
  birth_date: string
  phone_number: string
}

interface WorkScheduleViewerProps {
  workTypes: WorkType[]
  offDutyTypes: OffDutyType[]
  shiftData: ShiftData
  surveyInfo: {
    id: string
    gender: string
    age: number
    department: string
    institutionType: string
    location: string
  }
  personalInfo?: PersonalInfo | null
}

export default function WorkScheduleViewer({ 
  workTypes, 
  offDutyTypes, 
  shiftData, 
  surveyInfo,
  personalInfo 
}: WorkScheduleViewerProps) {
  // 근무유형/휴무유형을 ID로 찾는 함수
  const getTypeById = (id: string) => {
    const workType = workTypes.find(wt => wt.id === id)
    if (workType) return { type: 'work', data: workType }
    
    const offDutyType = offDutyTypes.find(ot => ot.id === id)
    if (offDutyType) return { type: 'off', data: offDutyType }
    
    return null
  }

  // 근무유형 표시 텍스트
  const getWorkTypeDisplayText = (workType: WorkType) => {
    let timeText = `${workType.startTime}~${workType.endTime}`
    let breakText = ''
    
    if (workType.customBreakTime && workType.customBreakTime.trim() !== '') {
      breakText = `, 휴게 ${workType.customBreakTime}`
    }
    
    return `${workType.name}(${timeText}${breakText})`
  }

  // 근무유형별 색상 생성 (인덱스 기반)
  const getColorByIndex = (index: number, total: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200', 
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
    ]
    return colors[index % colors.length]
  }

  // 휴무유형 색상
  const getOffDutyColor = () => 'bg-gray-100 text-gray-800 border-gray-200'

  // 날짜 키 생성
  const getDateKey = (month: number, day: number) => {
    return `2025-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  // 2025년 10월, 11월 날짜 정보
  const october2025Days = 31
  const november2025Days = 30

  return (
    <div className="space-y-4">
      {/* 통합 정보 박스 */}
      <div className="bg-gray-50 rounded-lg p-4">
        {/* 응답자 정보 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">응답자 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-900">
            <div><span className="font-medium text-gray-700">ID:</span> {surveyInfo.id.substring(0, 8)}...</div>
            <div><span className="font-medium text-gray-700">성별/연령:</span> {surveyInfo.gender} / {surveyInfo.age}세</div>
            <div><span className="font-medium text-gray-700">부서:</span> {surveyInfo.department}</div>
            <div><span className="font-medium text-gray-700">의료기관:</span> {surveyInfo.institutionType}</div>
            <div><span className="font-medium text-gray-700">지역:</span> {surveyInfo.location}</div>
          </div>
        </div>

        {/* 개인정보 (있는 경우) */}
        {personalInfo && (
          <div className="mb-4 border-t border-gray-300 pt-3">
            <h4 className="text-md font-semibold text-gray-900 mb-2">개인정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-900">
              <div><span className="font-medium text-gray-700">성명:</span> {personalInfo.name}</div>
              <div><span className="font-medium text-gray-700">생년월일:</span> {
                personalInfo.birth_date ? 
                  `${personalInfo.birth_date.substring(0, 4)}.${personalInfo.birth_date.substring(4, 6)}.${personalInfo.birth_date.substring(6, 8)}` : 
                  '-'
              }</div>
              <div><span className="font-medium text-gray-700">휴대전화:</span> {
                personalInfo.phone_number ? 
                  `${personalInfo.phone_number.substring(0, 3)}-${personalInfo.phone_number.substring(3, 7)}-${personalInfo.phone_number.substring(7)}` : 
                  '-'
              }</div>
            </div>
          </div>
        )}

        {/* 근무유형 정의 */}
        <div className="mb-4 border-t border-gray-300 pt-3">
          <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            근무유형 정의
          </h4>
          <div className="flex flex-wrap gap-2">
            {workTypes.map((workType, index) => (
              <div 
                key={workType.id}
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getColorByIndex(index, workTypes.length)}`}
              >
                {getWorkTypeDisplayText(workType)}
              </div>
            ))}
          </div>
        </div>

        {/* 휴무유형 정의 */}
        {offDutyTypes.length > 0 && (
          <div className="border-t border-gray-300 pt-3">
            <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center">
              <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
              휴무유형 정의
            </h4>
            <div className="flex flex-wrap gap-2">
              {offDutyTypes.map((offDutyType) => (
                <div 
                  key={offDutyType.id}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getOffDutyColor()}`}
                >
                  {offDutyType.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 근무표 캘린더 */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="text-md font-semibold text-gray-900">2025년 10-11월 근무표</h4>
        </div>
        
        <div className="p-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 테이블 헤더 */}
            <div className="bg-gray-50 grid grid-cols-3 border-b border-gray-200">
              <div className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                날짜
              </div>
              <div className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200">
                2025년 10월
              </div>
              <div className="p-3 text-center text-sm font-medium text-gray-700">
                2025년 11월
              </div>
            </div>

            {/* 테이블 본문 */}
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 31 }, (_, index) => {
                const day = index + 1
                const octoberDateKey = getDateKey(10, day)
                const novemberDateKey = getDateKey(11, day)
                const octoberShift = shiftData[octoberDateKey]
                const novemberShift = shiftData[novemberDateKey]
                const hasNovemberDay = day <= november2025Days

                const octoberType = octoberShift ? getTypeById(octoberShift) : null
                const novemberType = novemberShift ? getTypeById(novemberShift) : null

                return (
                  <div key={day} className="grid grid-cols-3 min-h-[50px]">
                    {/* 날짜 */}
                    <div className="p-3 border-r border-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-900">
                        {day}일
                      </span>
                    </div>

                    {/* 10월 */}
                    <div className="p-2 border-r border-gray-200 flex items-center justify-center">
                      {octoberType ? (
                        <div className={`px-2 py-1 rounded text-xs font-medium text-center border ${
                          octoberType.type === 'work' 
                            ? getColorByIndex(workTypes.findIndex(wt => wt.id === octoberShift), workTypes.length)
                            : getOffDutyColor()
                        }`}>
                          {octoberType.type === 'work' 
                            ? (octoberType.data as WorkType).name
                            : (octoberType.data as OffDutyType).name
                          }
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* 11월 */}
                    <div className="p-2 flex items-center justify-center">
                      {hasNovemberDay ? (
                        novemberType ? (
                          <div className={`px-2 py-1 rounded text-xs font-medium text-center border ${
                            novemberType.type === 'work' 
                              ? getColorByIndex(workTypes.findIndex(wt => wt.id === novemberShift), workTypes.length)
                              : getOffDutyColor()
                          }`}>
                            {novemberType.type === 'work' 
                              ? (novemberType.data as WorkType).name
                              : (novemberType.data as OffDutyType).name
                            }
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
