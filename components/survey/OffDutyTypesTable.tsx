'use client'

import { Plus, Trash2 } from 'lucide-react'
import { OffDutyType } from '@/lib/types'

interface OffDutyTypesTableProps {
  offDutyTypes: OffDutyType[]
  onChange: (offDutyTypes: OffDutyType[]) => void
}

export default function OffDutyTypesTable({ offDutyTypes, onChange }: OffDutyTypesTableProps) {
  const offDutyOptions = [
    'Off (휴무)',
    '연차',
    '생리휴가',
    '병가',
    '청가',
    '사용자 정의'
  ]

  const addOffDutyType = () => {
    const newOffDutyType: OffDutyType = {
      id: Date.now().toString(),
      name: 'Off (휴무)' // 기본값으로 "Off (휴무)" 선택
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

  const handleRadioChange = (index: number, selectedOption: string) => {
    if (selectedOption === '사용자 정의') {
      // 사용자 정의 선택 시 빈 문자열로 설정 (입력 필드가 나타나도록)
      updateOffDutyType(index, 'name', '')
    } else {
      // 기본 옵션 선택 시 해당 값으로 설정
      updateOffDutyType(index, 'name', selectedOption)
    }
  }

  const handleCustomInput = (index: number, customValue: string) => {
    updateOffDutyType(index, 'name', customValue)
  }

  const getSelectedOption = (offDutyType: OffDutyType) => {
    const predefinedOptions = offDutyOptions.slice(0, -1) // '사용자 정의' 제외
    if (predefinedOptions.includes(offDutyType.name)) {
      return offDutyType.name
    }
    return '사용자 정의'
  }

  const isCustomSelected = (offDutyType: OffDutyType) => {
    const predefinedOptions = offDutyOptions.slice(0, -1) // '사용자 정의' 제외
    return !predefinedOptions.includes(offDutyType.name)
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
              <span className="text-xs text-gray-500 hidden md:block">아래 6가지 옵션 중 선택 또는 직접 입력</span>
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
              휴무를 추가해주세요
            </div>
          ) : (
            offDutyTypes.map((offDutyType, index) => (
              <div key={offDutyType.id} className="px-2 md:px-4 py-3 md:py-4 bg-white hover:bg-gray-50">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    {/* 라디오 버튼 그룹 */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 mb-3">
                      {offDutyOptions.map(option => (
                        <label key={option} className="flex items-center cursor-pointer text-xs">
                          <input
                            type="radio"
                            name={`offDutyType-${offDutyType.id}`}
                            value={option}
                            checked={getSelectedOption(offDutyType) === option}
                            onChange={() => handleRadioChange(index, option)}
                            className="mr-1 h-3 w-3 text-green-600 flex-shrink-0"
                          />
                          <span className="text-gray-700 leading-tight">{option}</span>
                        </label>
                      ))}
                    </div>

                    {/* 사용자 정의 입력 필드 */}
                    {isCustomSelected(offDutyType) && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={offDutyType.name}
                          onChange={(e) => handleCustomInput(index, e.target.value)}
                          placeholder="휴무 유형을 직접 입력하세요"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                          style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                          autoComplete="off"
                        />
                      </div>
                    )}
                  </div>

                  {/* 삭제 버튼 */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => removeOffDutyType(index)}
                      className="p-1 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
        휴무 추가
      </button>

      {offDutyTypes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-4">
          <p className="text-yellow-800 text-xs md:text-sm">
            ⚠️ 최소 1개 이상의 휴무를 추가해야 다음 단계로 진행할 수 있습니다.
          </p>
        </div>
      )}

    </div>
  )
}
