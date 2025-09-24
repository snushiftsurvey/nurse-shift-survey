'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SurveyLimit {
  id: string
  setting_name: string
  setting_value: number
  department: string | null
  description: string
}

interface SurveyLimitsModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function SurveyLimitsModal({ isOpen, onClose, onUpdate }: SurveyLimitsModalProps) {
  const [limits, setLimits] = useState<SurveyLimit[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 현재 설정 조회
  const fetchLimits = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('survey_limits')
        .select('*')
        .order('setting_name')

      if (error) throw error

      setLimits(data || [])
    } catch (err) {
      console.error('응답자 수 제한 설정 조회 실패:', err)
      alert('설정을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 설정 값 변경
  const updateLimitValue = (settingName: string, newValue: number) => {
    setLimits(prev => prev.map(limit => 
      limit.setting_name === settingName 
        ? { ...limit, setting_value: newValue }
        : limit
    ))
  }

  // 설정 저장
  const handleSave = async () => {
    try {
      setSaving(true)

      // 각 설정을 개별적으로 업데이트
      for (const limit of limits) {
        const { error } = await supabase
          .from('survey_limits')
          .update({ 
            setting_value: limit.setting_value,
            updated_at: new Date().toISOString()
          })
          .eq('id', limit.id)

        if (error) throw error
      }

      alert('응답자 수 제한 설정이 저장되었습니다.')
      onUpdate() // 부모 컴포넌트에 변경사항 알림
      onClose()
    } catch (err) {
      console.error('응답자 수 제한 설정 저장 실패:', err)
      alert('설정 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLimits()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            응답자 수 제한 설정
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">설정을 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {limits.map((limit) => {
                const displayName = limit.setting_name === 'total_limit' ? '전체 응답자 수' :
                  limit.setting_name === 'general_ward_limit' ? '일반병동' :
                  limit.setting_name === 'integrated_care_ward_limit' ? '간호·간병통합서비스 병동' :
                  limit.setting_name === 'icu_limit' ? '중환자실' :
                  limit.setting_name

                return (
                  <div key={limit.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {displayName}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={limit.setting_value}
                        onChange={(e) => updateLimitValue(limit.setting_name, parseInt(e.target.value) || 0)}
                        min="0"
                        max="1000"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                    {limit.description && (
                      <p className="text-xs text-gray-500">{limit.description}</p>
                    )}
                  </div>
                )
              })}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ 설정된 제한에 도달하면 해당 부서 또는 전체 설문이 자동으로 종료됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
