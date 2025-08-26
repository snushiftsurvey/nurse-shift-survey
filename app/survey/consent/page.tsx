'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'

export default function ConsentPage() {
  const [consent, setConsent] = useState<'agree' | 'disagree' | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  const isAccessible = useProtectedRoute()
  const consentBoxRef = useRef<HTMLDivElement>(null)

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

  const handleSubmit = () => {
    if (consent === 'disagree') {
      alert('연구 참여에 동의하지 않으셨습니다. 설문조사를 종료합니다.')
      router.push('/')
    } else if (consent === 'agree') {
      router.push('/survey/eligibility')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              연구 동의서
            </h1>
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
            
            {/* 연구참여자용 설명문 이미지 3개 */}
            <div className="space-y-6 mb-8">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src="/images/info-1.png"
                  alt="연구참여자용 설명문 1"
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                  priority
                />
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src="/images/info-2.png"
                  alt="연구참여자용 설명문 2"
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                />
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src="/images/info-3.png"
                  alt="연구참여자용 설명문 3"
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                />
              </div>
              
              {/* 동의서 이미지 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src="/images/agree.png?1"
                  alt="연구 참여 동의서"
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>

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
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consent"
                  value="agree"
                  checked={consent === 'agree'}
                  onChange={(e) => setConsent(e.target.value as 'agree')}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">동의함</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consent"
                  value="disagree"
                  checked={consent === 'disagree'}
                  onChange={(e) => setConsent(e.target.value as 'disagree')}
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
              disabled={!consent}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base flex-shrink-0"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
