'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSurvey } from '@/hooks/useSurvey'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'

export default function PersonalInfoPage() {
  const [consentPersonalInfo, setConsentPersonalInfo] = useState<boolean | null>(null)
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    birthDate: '',
    phoneNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateSurveyData, updatePersonalInfo, submitSurvey } = useSurvey()
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

  const handleConsentChange = (consent: boolean) => {
    setConsentPersonalInfo(consent)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      if (consentPersonalInfo === false) {
        // 개인정보 수집에 동의하지 않은 경우 - 설문 데이터만 저장
        console.log('📝 개인정보 미동의 - 설문 데이터만 저장')
        await submitSurvey({ consentPersonalInfo: false })
        alert('감사합니다. 설문이 완료되었습니다.')
        router.push('/survey/complete')
      } else if (consentPersonalInfo === true) {
        // 개인정보를 모두 입력했는지 확인
        if (!personalInfo.name || !personalInfo.birthDate || !personalInfo.phoneNumber) {
          alert('모든 개인정보를 입력해주세요.')
          return
        }
        
        if (personalInfo.birthDate.length !== 8) {
          alert('생년월일을 8자리로 입력해주세요. (예: 19900101)')
          return
        }
        
        // 생년월일 유효성 검사
        const year = parseInt(personalInfo.birthDate.substring(0, 4))
        const month = parseInt(personalInfo.birthDate.substring(4, 6))
        const day = parseInt(personalInfo.birthDate.substring(6, 8))
        
        if (year < 1900 || year > new Date().getFullYear()) {
          alert('올바른 연도를 입력해주세요.')
          return
        }
        
        if (month < 1 || month > 12) {
          alert('올바른 월을 입력해주세요. (01-12)')
          return
        }
        
        const daysInMonth = new Date(year, month, 0).getDate()
        if (day < 1 || day > daysInMonth) {
          alert(`${month}월에는 ${day}일이 없습니다. 올바른 일을 입력해주세요.`)
          return
        }
        
        if (personalInfo.phoneNumber.length !== 11) {
          alert('휴대폰번호를 11자리로 입력해주세요. (예: 01012345678)')
          return
        }
        
        // 휴대폰번호 유효성 검사
        if (!personalInfo.phoneNumber.startsWith('010')) {
          alert('휴대폰번호는 010으로 시작해야 합니다.')
          return
        }

        // 설문 데이터와 개인정보 모두 저장 (직접 값 전달)
        console.log('📝 개인정보 동의 - 개인정보와 설문 데이터 모두 저장')
        console.log('📋 제출할 개인정보:', personalInfo)
        await submitSurvey({ 
          consentPersonalInfo: true, 
          personalInfo 
        })
        alert('감사합니다. 설문이 완료되었습니다.')
        router.push('/survey/complete')
      }
    } catch (error) {
      console.error('💥 설문 제출 실패 상세:', error)
      console.error('🔍 에러 타입:', typeof error)
      console.error('🔍 에러 메시지:', error instanceof Error ? error.message : error)
      console.error('🔍 에러 스택:', error instanceof Error ? error.stack : 'No stack')
      
      alert(`설문 제출 중 오류가 발생했습니다.\n에러: ${error instanceof Error ? error.message : error}\n다시 시도해주세요.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
               연구참여 사례
            </h1>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-5/6"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">5단계 / 6단계</p>
          </div>

          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                설문이 모두 완료되었습니다!
              </h2>
              
              <div className="text-gray-700 space-y-3">
                <p className="text-sm md:text-base">
                참여해주신 답례로 5,000원 상당 모바일 기프티콘을 제공을 위해 
                다음 개인정보 수집 및 이용에 대한 동의를 구하고자 합니다. 해당 개인정보는 연구 목적이 아닌, 
                사례지급을 위한 행정처리용으로만 사용될 것이며 행정처리 이후 즉시 폐기될 것입니다. 
                </p>
                
                <div className="bg-white rounded p-4 space-y-2 text-sm">
                  <p><strong>1. 개인정보의 수집 및 이용 목적:</strong> 설문조사 응답자 기프티콘 보상</p>
                  <p><strong>2. 수집하려는 개인정보의 항목:</strong> 성명, 생년월일, 휴대폰번호</p>
                  <p><strong>3. 개인정보의 보유 및 이용기간:</strong> 모바일 기프티콘 발송 후 파기(개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체없이 파기합니다.)</p>
                </div>

                <p className="font-medium text-sm md:text-base">
                개인정보보호법에 의거하여 개인정보 수집 및 이용에 관한 동의를 거부하실 수 있습니다. 
                다만 동의하지 않으시는 경우 설문참여 보상에서 제외됨을 알려드립니다.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 text-center">
                모바일 기프티콘 증정을 위한 개인정보 수집과 이용에 동의하십니까?
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consent"
                  checked={consentPersonalInfo === true}
                  onChange={() => handleConsentChange(true)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">예 (개인정보를 입력하겠습니다)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consent"
                  checked={consentPersonalInfo === false}
                  onChange={() => handleConsentChange(false)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">아니요 (기프티콘은 필요없습니다)</span>
              </label>
            </div>

            {consentPersonalInfo === true && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-medium text-gray-800">
                  개인정보 입력
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    성명
                  </label>
                  <input
                    type="text"
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                    placeholder="실명을 입력해주세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    autoComplete="off"
                    autoFocus={false}
                    style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    생년월일 (8자리)
                  </label>
                  <input
                    type="text"
                    value={personalInfo.birthDate}
                    onChange={(e) => setPersonalInfo({...personalInfo, birthDate: e.target.value.replace(/\D/g, '')})}
                    placeholder="예: 19900101"
                    maxLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    autoComplete="off"
                    autoFocus={false}
                    style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    휴대폰번호 (11자리, 하이픈 없이)
                  </label>
                  <input
                    type="text"
                    value={personalInfo.phoneNumber}
                    onChange={(e) => setPersonalInfo({...personalInfo, phoneNumber: e.target.value.replace(/\D/g, '')})}
                    placeholder="예: 01012345678"
                    maxLength={11}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    autoComplete="off"
                    autoFocus={false}
                    style={{ color: '#111827', WebkitTextFillColor: '#111827' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-row justify-between items-center gap-4">
            <Link
              href="/survey/demographics"
              className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base flex-shrink-0"
            >
              이전
            </Link>
            
            <button
              onClick={handleSubmit}
              disabled={consentPersonalInfo === null || isSubmitting}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base flex-shrink-0"
            >
              {isSubmitting ? '제출 중...' : '설문 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
