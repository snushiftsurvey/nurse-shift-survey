'use client'

import { Plus, Trash2 } from 'lucide-react'
import { OffDutyType } from '@/lib/types'
import { useEffect } from 'react'

interface OffDutyTypesTableProps {
  offDutyTypes: OffDutyType[]
  onChange: (offDutyTypes: OffDutyType[]) => void
}

export default function OffDutyTypesTable({ offDutyTypes, onChange }: OffDutyTypesTableProps) {
  const defaultOffDutyNames = [
    'Off (휴무)',
    '연차',
    '생리휴가',
    '병가',
    '청가'
  ]

  // 초기 기본 휴무들을 자동으로 생성
  useEffect(() => {
    if (offDutyTypes.length === 0) {
      const defaultOffDutyTypes = defaultOffDutyNames.map((name, index) => ({
        id: `default-${index}`,
        name: name,
        isDefault: true
      }))
      onChange(defaultOffDutyTypes)
    }
  }, [])

  // 기본 휴무인지 확인하는 함수
  const isDefaultOffDuty = (offDutyType: OffDutyType) => {
    return offDutyType.isDefault === true || defaultOffDutyNames.includes(offDutyType.name)
  }

  const addOffDutyType = () => {
    const newOffDutyType: OffDutyType = {
      id: Date.now().toString(),
      name: '', // 사용자 정의 휴무는 빈 문자열로 시작
      isDefault: false
    }
    onChange([...offDutyTypes, newOffDutyType])
  }

  const updateOffDutyType = (index: number, field: keyof OffDutyType, value: string) => {
    const updated = offDutyTypes.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    })
    onChange(updated)
  }

  const removeOffDutyType = (index: number) => {
    const updated = offDutyTypes.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-1 md:px-4 py-2 md:py-3 border-b border-gray-200">
          <div className="flex justify-between items-center text-xs md:text-sm font-medium text-gray-700">
            <div>
              <span className="block md:inline">휴무명칭</span>
              <span className="text-xs text-gray-500 hidden md:block">기본 휴무 5개 + 사용자 정의 휴무</span>
            </div>
            <div className="text-center">
              <span className="hidden md:inline">삭제</span>
              <span className="md:hidden">×</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {offDutyTypes.length === 0 ? (
            <div className="px-2 md:px-4 py-6 md:py-8 text-center text-gray-500">
              기본 휴무를 불러오는 중...
            </div>
          ) : (
            offDutyTypes.map((offDutyType, index) => (
              <div key={offDutyType.id} className={`px-2 md:px-4 py-3 md:py-4 ${isDefaultOffDuty(offDutyType) ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}>
                <div className="flex justify-between items-center gap-2">
                  <div className="flex-1">
                    {isDefaultOffDuty(offDutyType) ? (
                      // 기본 휴무: 이름만 표시 (수정 불가)
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          기본
                        </span>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {offDutyType.name}
                        </span>
                      </div>
                    ) : (
                      // 사용자 정의 휴무: 입력 필드
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                          사용자 정의
                        </span>
                        <input
                          type="text"
                          value={offDutyType.name}
                          onChange={(e) => updateOffDutyType(index, 'name', e.target.value)}
                          placeholder="휴무 유형을 직접 입력하세요"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                          style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                          autoComplete="off"
                        />
                      </div>
                    )}
                  </div>

                  {/* 삭제 버튼 (사용자 정의 휴무만) */}
                  <div className="flex-shrink-0">
                    {!isDefaultOffDuty(offDutyType) && (
                      <button
                        onClick={() => removeOffDutyType(index)}
                        className="p-1 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <button
        onClick={addOffDutyType}
        className="w-full flex items-center justify-center gap-2 px-2 md:px-4 py-2 md:py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
      >
        <Plus className="w-4 h-4 md:w-5 md:h-5" />
        사용자 정의 휴무 추가
      </button>

      {offDutyTypes.filter(odt => !isDefaultOffDuty(odt) && !odt.name.trim()).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-4">
          <p className="text-yellow-800 text-xs md:text-sm">
            ⚠️ 사용자 정의 휴무의 이름을 입력해주세요.
          </p>
        </div>
      )}

    </div>
  )
}
