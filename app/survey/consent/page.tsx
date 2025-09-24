'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { useResearcher } from '@/hooks/useResearcher'
import { useConsentDraft } from '@/hooks/useConsentDraft'
import ConsentFormOverlay from '@/components/survey/ConsentFormOverlay'

export default function ConsentPage() {
  const [consentData, setConsentData] = useState({
    name1: '',       // 첫 번째 동의서용 성명
    name2: '',       // 두 번째 동의서용 성명  
    signature1: '',  // agree-sig-1용 서명
    signature2: '',  // agree-sig-2용 서명
    date: '', // 현재 시간으로 동적 설정
    agreed: null as boolean | null
  })
  const [isVisible, setIsVisible] = useState(false)
  
  const router = useRouter()
  const isAccessible = useProtectedRoute()
  const consentBoxRef = useRef<HTMLDivElement>(null)
  
  // 연구원 정보 및 동의서 임시 저장 훅
  const { researcher, loading: researcherLoading } = useResearcher()
  const { draft, saveDraft, loading: draftLoading, startNewSession, clearDraft, refresh } = useConsentDraft()

  // 오늘 날짜를 YYYY/MM/DD 형식으로 초기 설정 (페이지 표시용)
  useEffect(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const displayDate = `${yyyy}.${mm}.${dd}`
    setConsentData(prev => ({ ...prev, date: displayDate }))
  }, [])

  // 동의서 페이지에서 수동으로 임시 저장 데이터 로딩
  useEffect(() => {

    console.log(' [CONSENT 페이지] 상태 확인:', {
      currentPath: window.location.pathname,
      draft,
      researcher: researcher ? { name: researcher.name, hasSignature: !!researcher.signature_image } : null
    })
    refresh() // 수동으로 데이터 로딩
  }, [])
  
  // draft와 researcher 상태 변화 모니터링
  useEffect(() => {
    console.log('🔍 [CONSENT 페이지] draft/researcher 상태 변화:', {
      currentPath: window.location.pathname,
      draft,
      researcher: researcher ? { name: researcher.name, hasSignature: !!researcher.signature_image } : null
    })
  }, [draft, researcher])

  // 이전 데이터 자동 복원 비활성화 - 사용자 요청에 따라 제거
  // useEffect(() => {
  //   if (draft && !draftLoading) {
  //     setConsentData(prev => ({
  //       ...prev,
  //       name1: draft.consent_name || '',
  //       name2: draft.consent_name || '', 
  //       signature1: draft.consent_signature1 || '',
  //       signature2: draft.consent_signature2 || '',
  //       date: draft.consent_date || prev.date
  //     }))
  //   }
  // }, [draft, draftLoading])

  // 설문 중단 시 서명 데이터 정리 (컴포넌트 언마운트 시에만)
  useEffect(() => {
    // 컴포넌트 언마운트 시에만 실행되는 cleanup 함수
    return () => {
      // 정상적인 흐름인지 확인
      const currentPath = window.location.pathname
      const hasSignatureData = consentData.signature1 || consentData.signature2
      
      // personal-info나 complete로 정상 진행하는 경우는 정리하지 않음
      if (currentPath === '/survey/personal-info' || 
          currentPath === '/survey/complete' ||
          currentPath === '/survey/consent') {
        console.log('📝 정상적인 설문 진행 - 서명 데이터 유지')
        return
      }
      
      // 설문 제출 중인 경우도 정리하지 않음
      if ((window as any).isSubmittingSurvey) {
        console.log('📝 설문 제출 중 - 서명 데이터 유지')
        return
      }
      
      // 비정상 이탈 시에만 정리
      if (hasSignatureData) {
        console.log('🧹 동의서 페이지에서 비정상 이탈 - 서명 데이터 정리')
        clearDraft()
      }
    }
  }, []) // dependency 제거하여 컴포넌트 언마운트 시에만 실행

  // 스크롤 애니메이션을 위한 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.3 } // 30% 보이면 애니메이션 시작
    )

    if (consentBoxRef.current) {
      observer.observe(consentBoxRef.current)
    }

    return () => {
      if (consentBoxRef.current) {
        observer.unobserve(consentBoxRef.current)
      }
    }
  }, [])

  // 설문이 시작되지 않았으면 빈 화면 표시 (리다이렉트 진행 중)
  if (!isAccessible) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>
  }

  const handleSubmit = async () => {
    if (consentData.agreed === false) {
      alert('연구 참여에 동의하지 않으셨습니다. 설문조사를 종료합니다.')
      router.push('/')
      return
    }
    
    if (consentData.agreed !== true) {
      alert('연구 참여 여부를 선택해주세요.')
      return
    }
    
    if (!consentData.name1.trim() || !consentData.name2.trim()) {
      alert('모든 동의서에 성명을 입력해주세요.')
      return
    }
    
    if (!consentData.signature1.trim()) {
      alert('첫 번째 동의서에 서명을 완료해주세요.')
      return
    }
    
    if (!consentData.signature2.trim()) {
      alert('두 번째 동의서에 서명을 완료해주세요.')
      return
    }
    
    // 최종 임시 저장 (설문 완료 시 PDF로 변환될 예정)
    try {
      console.log('💾 최종 서명 데이터 임시 저장 중...')
      
      // 현재 한국 시간으로 동의서 날짜 설정
      const currentDate = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      }).replace(/\s/g, '').replace(/\.$/, '')
      
      const saveResult = await saveDraft({
        consent_name: consentData.name1, // 첫 번째 동의서 이름 사용
        consent_signature1: consentData.signature1,
        consent_signature2: consentData.signature2,
        consent_date: currentDate, // 현재 시간으로 설정
        researcher_id: researcher?.id
      })
      console.log('💾 최종 서명 데이터 임시 저장 결과:', saveResult)

      console.log('동의서 임시 저장 완료:', consentData)
      router.push('/survey/eligibility')
    } catch (error) {
      console.error('동의서 저장 오류:', error)
      alert('동의서 저장 중 오류가 발생했습니다.')
    }
  }

  const handleName1Change = (name: string) => {
    setConsentData(prev => ({ ...prev, name1: name }))
    // 실시간 임시 저장 제거 - 다음 버튼 클릭 시에만 저장
  }

  const handleName2Change = (name: string) => {
    setConsentData(prev => ({ ...prev, name2: name }))
    // 실시간 임시 저장 제거 - 다음 버튼 클릭 시에만 저장
  }

  const handleSignature1Change = (signature: string) => {
    setConsentData(prev => ({ ...prev, signature1: signature }))
    // 실시간 임시 저장 제거 - 다음 버튼 클릭 시에만 저장
  }

  const handleSignature2Change = (signature: string) => {
    setConsentData(prev => ({ ...prev, signature2: signature }))
    // 실시간 임시 저장 제거 - 다음 버튼 클릭 시에만 저장
  }

  const handleAgreementChange = (agreed: boolean) => {
    setConsentData(prev => ({ ...prev, agreed }))
  }

  // 디바운싱된 자동 저장 제거 - 다음 버튼 클릭 시에만 저장
  // const debouncedSave = useMemo(() => { ... }, [saveDraft]) - 제거됨

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              연구 동의서
            </h1>
            
            {/* 이전 데이터 알림 제거 - 사용자 요청에 따라 항상 깨끗한 상태로 시작 */}
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full w-2/6"></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">2단계 / 6단계</p>
          </div>

          <div className="mb-8">
            <div className="bg-sky-50 px-4 py-3 mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                연구 참여자용 설명문 및 동의서
              </h2>
            </div>
            
            {/* 연구참여자용 설명문 이미지 */}
            <div className="space-y-6 mb-8">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src="/images/signature/info-1.png?20250924"
                  alt="연구참여자용 설명문 1"
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                  priority
                />
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src="/images/signature/info-2.png?20250924"
                  alt="연구참여자용 설명문 2"
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                />
              </div>

              
          {/* 첫 번째 동의서 - 서명 가능 */}
          <ConsentFormOverlay
            consentData={{
              name: consentData.name1,  // 첫 번째 동의서는 name1 사용
              signature1: consentData.signature1,
              signature2: consentData.signature2,
              date: consentData.date,
              agreed: consentData.agreed
            }}
            onNameChange={handleName1Change}
            onSignatureChange={handleSignature1Change}
            imageSrc="/images/signature/agree-sig-1.png?0924?2025-0924"
            signatureKey="signature1"
            title="첫 번째 동의서"
            researcherData={researcher ? {
              name: researcher.name,
              signature: researcher.signature_image,
              date: new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }).replace(/\s/g, '').replace(/\.$/, '')
            } : undefined}
          />

          {/* 두 번째 동의서 - 서명 가능 */}
          <ConsentFormOverlay
            consentData={{
              name: consentData.name2,  // 두 번째 동의서는 name2 사용
              signature1: consentData.signature1,
              signature2: consentData.signature2,
              date: consentData.date,
              agreed: consentData.agreed
            }}
            onNameChange={handleName2Change}
            onSignatureChange={handleSignature2Change}
            imageSrc="/images/signature/agree-sig-2.png?v=20250924"
            signatureKey="signature2"
            title="두 번째 동의서"
            researcherData={researcher ? {
              name: researcher.name,
              signature: researcher.signature_image,
              date: new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }).replace(/\s/g, '').replace(/\.$/, '')
            } : undefined}
          />
            </div>
          </div>

          {/* 동의 확인 섹션 */}
          <div className="mb-8">
            <div 
              ref={consentBoxRef}
              className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 transition-all duration-700 ease-out ${
                isVisible 
                  ? 'opacity-100 transform translate-x-0' 
                  : 'opacity-0 transform -translate-x-10'
              }`}
            >
              <h3 className="text-base md:text-lg font-medium text-blue-900 mb-1">
                본 연구에 참여하시겠습니까?
              </h3>
              <p className="text-xs md:text-sm text-blue-800">
                위의 설명문과 동의서를 모두 읽으신 후 선택해주세요.
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consent"
                  value="agree"
                  checked={consentData.agreed === true}
                  onChange={() => handleAgreementChange(true)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">동의함</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consent"
                  value="disagree"
                  checked={consentData.agreed === false}
                  onChange={() => handleAgreementChange(false)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">동의하지 않음</span>
              </label>
            </div>

          </div>

          <div className="flex flex-row justify-between items-center gap-4">
            <Link 
              href="/survey"
              className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base flex-shrink-0"
            >
              이전
            </Link>
            
            <button
              onClick={handleSubmit}
              disabled={draftLoading || researcherLoading || consentData.agreed !== true || !consentData.name1.trim() || !consentData.name2.trim() || !consentData.signature1.trim() || !consentData.signature2.trim()}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base flex-shrink-0"
            >
              {draftLoading ? '저장 중...' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
