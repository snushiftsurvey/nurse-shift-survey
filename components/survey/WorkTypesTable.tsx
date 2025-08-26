'use client'

import { Plus, Trash2 } from 'lucide-react'
import { WorkType } from '@/lib/types'

interface WorkTypesTableProps {
  workTypes: WorkType[]
  onChange: (workTypes: WorkType[]) => void
}

export default function WorkTypesTable({ workTypes, onChange }: WorkTypesTableProps) {

  const addWorkType = () => {
    const newWorkType: WorkType = {
      id: (Date.now() + Math.random()).toString(), // ID 중복 방지
      name: '',
      startTime: '09:00',
      endTime: '18:00',
      breakTime: 'custom',
      customBreakTime: ''
    }
    onChange([...workTypes, newWorkType])
  }

  const updateWorkType = (index: number, field: keyof WorkType, value: string) => {
    const updated = workTypes.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        // breakTime은 항상 'custom'으로 고정
        if (field === 'customBreakTime') {
          updatedItem.breakTime = 'custom'
        }
        return updatedItem
      }
      return item
    })
    onChange(updated)
  }

  const removeWorkType = (index: number) => {
    const updated = workTypes.filter((_, i) => i !== index)
    onChange(updated)
  }

  const generateTimeOptions = () => {
    const times: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-1 md:px-4 py-2 md:py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-0.5 md:gap-4 text-xs md:text-sm font-medium text-gray-700">
            <div className="col-span-4 md:col-span-4">
              <span className="block md:inline">근무명칭</span>
              <span className="text-xs text-gray-500 hidden md:block">(한글/영어 모두 가능)</span>
            </div>
            <div className="col-span-2 md:col-span-2">
              <span className="block">시작</span>
              <span className="text-xs text-gray-500 hidden md:inline">시각</span>
            </div>
            <div className="col-span-2 md:col-span-2">
              <span className="block">종료</span>
              <span className="text-xs text-gray-500 hidden md:inline">시각</span>
            </div>
            <div className="col-span-3 md:col-span-3">
              <span className="block">휴게</span>
              <span className="text-xs text-gray-500 hidden md:block">보장된 휴게시간 (직접 입력)</span>
            </div>
            <div className="col-span-1 md:col-span-1 text-center">
              <span className="hidden md:inline">삭제</span>
              <span className="md:hidden">×</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {workTypes.length === 0 ? (
            <div className="px-2 md:px-4 py-6 md:py-8 text-center text-gray-500">
              근무유형을 추가해주세요
            </div>
          ) : (
            workTypes.map((workType, index) => (
              <div key={workType.id} className="px-0.5 md:px-4 py-2 md:py-3 bg-white hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-0.5 md:gap-4 items-center">
                  {/* 근무/휴무 명칭 */}
                  <div className="col-span-4 md:col-span-4">
                    <input
                      type="text"
                      value={workType.name}
                      onChange={(e) => updateWorkType(index, 'name', e.target.value)}
                      placeholder="예: 데이, 나이트, 이브닝"
                      className="w-full px-1 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                    />
                  </div>

                  {/* 시작시각 */}
                  <div className="col-span-2 md:col-span-2">
                    <select
                      value={workType.startTime}
                      onChange={(e) => updateWorkType(index, 'startTime', e.target.value)}
                      className="w-full px-0 md:px-2 py-1.5 md:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {/* 종료시각 */}
                  <div className="col-span-2 md:col-span-2">
                    <select
                      value={workType.endTime}
                      onChange={(e) => updateWorkType(index, 'endTime', e.target.value)}
                      className="w-full px-0 md:px-2 py-1.5 md:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {/* 휴게시간 */}
                  <div className="col-span-3 md:col-span-3">
                    <input
                      type="text"
                      value={workType.customBreakTime || ''}
                      onChange={(e) => updateWorkType(index, 'customBreakTime', e.target.value)}
                      placeholder="예: 1시간, 30분"
                      className="w-full px-1 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
                    />
                  </div>

                  {/* 삭제 버튼 */}
                  <div className="col-span-1 md:col-span-1 flex justify-center">
                    <button
                      onClick={() => removeWorkType(index)}
                      className="p-0.5 md:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={addWorkType}
        className="w-full flex items-center justify-center gap-2 px-2 md:px-4 py-2 md:py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4 md:w-5 md:h-5" />
        근무 유형 추가
      </button>

      {workTypes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 md:p-4">
          <p className="text-yellow-800 text-xs md:text-sm">
            ⚠️ 최소 1개 이상의 근무유형을 입력해야 다음 단계로 진행할 수 있습니다.
          </p>
        </div>
      )}
      

    </div>
  )
}
