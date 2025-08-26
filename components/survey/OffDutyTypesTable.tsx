'use client'

import { Plus, Trash2 } from 'lucide-react'
import { OffDutyType } from '@/lib/types'

interface OffDutyTypesTableProps {
  offDutyTypes: OffDutyType[]
  onChange: (offDutyTypes: OffDutyType[]) => void
}

export default function OffDutyTypesTable({ offDutyTypes, onChange }: OffDutyTypesTableProps) {
  const addOffDutyType = () => {
    const newOffDutyType: OffDutyType = {
      id: Date.now().toString(),
      name: ''
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
          <div className="grid grid-cols-12 gap-0.5 md:gap-4 text-xs md:text-sm font-medium text-gray-700">
            <div className="col-span-11 md:col-span-11">
              <span className="block md:inline">휴무명칭</span>
              
            </div>
            <div className="col-span-1 md:col-span-1 text-center">
              <span className="hidden md:inline">삭제</span>
              <span className="md:hidden">×</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {offDutyTypes.length === 0 ? (
            <div className="px-2 md:px-4 py-6 md:py-8 text-center text-gray-500">
              휴무유형을 추가해주세요
            </div>
          ) : (
            offDutyTypes.map((offDutyType, index) => (
              <div key={offDutyType.id} className="px-0.5 md:px-4 py-2 md:py-3 bg-white hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-0.5 md:gap-4 items-center">
                  {/* 휴무 명칭 */}
                  <div className="col-span-11 md:col-span-11">
                    <input
                      type="text"
                      value={offDutyType.name}
                      onChange={(e) => updateOffDutyType(index, 'name', e.target.value)}
                      placeholder="예: 연차,오프"
                      className="w-full px-1 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs md:text-sm"
                    />
                  </div>

                  {/* 삭제 버튼 */}
                  <div className="col-span-1 md:col-span-1 flex justify-center">
                    <button
                      onClick={() => removeOffDutyType(index)}
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
        onClick={addOffDutyType}
        className="w-full flex items-center justify-center gap-2 px-2 md:px-4 py-2 md:py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
      >
        <Plus className="w-4 h-4 md:w-5 md:h-5" />
        휴무 유형 추가
      </button>

    </div>
  )
}
