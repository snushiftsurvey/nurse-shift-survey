'use client'

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import SignatureCanvas from 'react-signature-canvas'

interface ConsentFormOverlayProps {
  consentData: {
    name: string
    signature1: string
    signature2: string
    date: string
    agreed: boolean | null
  }
  onNameChange: (name: string) => void
  onSignatureChange: (signature: string) => void
  imageSrc: string  // 사용할 이미지 경로
  signatureKey: 'signature1' | 'signature2'  // 어떤 서명을 사용할지
  title?: string  // 제목 (예: "첫 번째 동의서", "두 번째 동의서")
  
  // 연구원 정보 (자동 삽입용)
  researcherData?: {
    name: string
    signature: string
    date: string
  }
}

export default function ConsentFormOverlay({ 
  consentData, 
  onNameChange, 
  onSignatureChange,
  imageSrc,
  signatureKey,
  title,
  researcherData
}: ConsentFormOverlayProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const expandedSigRef = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isSignatureExpanded, setIsSignatureExpanded] = useState(false)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  useEffect(() => {
    const currentSignature = consentData[signatureKey]
    if (currentSignature && sigRef.current) {
      sigRef.current.fromDataURL(currentSignature)
    }
  }, [consentData, signatureKey])

  const clearSignature = () => {
    if (sigRef.current) {
      sigRef.current.clear()
    }
    if (expandedSigRef.current) {
      expandedSigRef.current.clear()
    }
    onSignatureChange('')
  }

  const handleSignatureEnd = () => {
    const activeRef = isSignatureExpanded ? expandedSigRef : sigRef
    if (activeRef.current && !activeRef.current.isEmpty()) {
      const signatureData = activeRef.current.getTrimmedCanvas().toDataURL('image/png')
      onSignatureChange(signatureData)
      
      // 확대된 서명을 일반 캔버스에도 동기화
      if (isSignatureExpanded && sigRef.current) {
        sigRef.current.fromDataURL(signatureData)
      }
    }
  }

  const openSignatureModal = () => {
    setIsSignatureExpanded(true)
    setTimeout(() => {
      const currentSignature = consentData[signatureKey]
      if (expandedSigRef.current && currentSignature) {
        expandedSigRef.current.fromDataURL(currentSignature)
      }
    }, 100)
  }

  const closeSignatureModal = () => {
    setIsSignatureExpanded(false)
  }

  // 이미지맵 좌표를 기반으로 정확한 위치 계산
  const IMAGE_WIDTH = 992   // 원본 이미지 너비
  const IMAGE_HEIGHT = 1403 // 원본 이미지 높이
  
  // 이미지맵 좌표 정의
  const COORDINATES_SIG1 = {
    // agree-sig-1.png용 좌표 (서명칸 높이 기준으로 성명칸 높이 조정)
    name1: { left: 139, top: 614, right: 340, bottom: 661 },    // 성명1 (47px 높이)
    signature1: { left: 390, top: 614, right: 590, bottom: 661 }, // 서명1 (47px 높이)
    date1: { left: 638, top: 630, right: 839, bottom: 660 },    // 날짜1
    name2: { left: 137, top: 698, right: 337, bottom: 739 },    // 성명2 (41px 높이)
    signature2: { left: 392, top: 698, right: 590, bottom: 739 }, // 서명2 (41px 높이)
    date2: { left: 639, top: 709, right: 838, bottom: 740 }     // 날짜2
  }
  
  const COORDINATES_SIG2 = {
    // agree-sig-2.png용 좌표 (서명칸 높이 기준으로 성명칸 높이 조정)
    name1: { left: 139, top: 605, right: 340, bottom: 652 },    // 성명1 (47px 높이)
    signature1: { left: 390, top: 605, right: 590, bottom: 652 }, // 서명1 (47px 높이)
    date1: { left: 638, top: 621, right: 839, bottom: 651 },    // 날짜1
    name2: { left: 137, top: 689, right: 337, bottom: 730 },    // 성명2 (41px 높이)
    signature2: { left: 392, top: 689, right: 590, bottom: 730 }, // 서명2 (41px 높이)
    date2: { left: 639, top: 700, right: 838, bottom: 731 }     // 날짜2
  }
  
  // 사용할 좌표 선택
  const COORDINATES = imageSrc.includes('agree-sig-2') ? COORDINATES_SIG2 : COORDINATES_SIG1
  
  // 좌표를 비율로 변환하여 반응형 스타일 생성
  const getCoordinateStyle = (coordKey: keyof typeof COORDINATES) => {
    const coord = COORDINATES[coordKey]
    return {
      position: 'absolute' as const,
      left: `${(coord.left / IMAGE_WIDTH) * 100}%`,
      top: `${(coord.top / IMAGE_HEIGHT) * 100}%`,
      width: `${((coord.right - coord.left) / IMAGE_WIDTH) * 100}%`,
      height: `${((coord.bottom - coord.top) / IMAGE_HEIGHT) * 100}%`,
      fontSize: containerWidth < 600 ? '10px' : `${Math.max(16, containerWidth * 0.022)}px`
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div ref={containerRef} className="relative">
        <Image
          src={imageSrc}
          alt={title || "연구 참여 동의서"}
          width={992}
          height={1403}
          className="w-full h-auto"
          priority
        />
        
        {/* 성명1 입력 필드 - 첫 번째 줄 성명란 */}
        <input
          type="text"
          value={consentData.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder=""
          className={`border-1 border-gray-400 text-black font-medium focus:outline-none focus:ring-1 focus:ring-green-500 px-1 text-center flex items-center rounded-sm ${
            consentData.name.trim() ? 'bg-transparent' : 'bg-green-50 bg-opacity-60 animate-pulse-input'
          }`}
          style={getCoordinateStyle('name1')}
        />

        {/* 서명1 캔버스 - 첫 번째 줄 서명란 */}
        <div 
          className={`cursor-pointer hover:bg-green-50 hover:bg-opacity-20 transition-colors border-2 border-dashed hover:border-green-300 rounded-sm ${
            consentData[signatureKey] ? 'bg-transparent border-transparent' : 'bg-green-50 bg-opacity-40 border-green-300 animate-pulse-signature'
          }`}
          style={getCoordinateStyle('signature1')}
          onClick={openSignatureModal}
        >
          {consentData[signatureKey] ? (
            // 서명이 있는 경우: 서명 이미지 표시
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={consentData[signatureKey]} 
                alt="서명" 
                className="max-w-full max-h-full object-contain"
                style={{ filter: 'contrast(1.2)' }}
              />
            </div>
          ) : (
            // 서명이 없는 경우: 안내 메시지
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center justify-center space-x-1 sm:flex-col sm:space-x-0 sm:space-y-0.5">
                <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-green-600 text-[7px] sm:text-xs signature-guide-text font-medium">서명</span>
              </div>
            </div>
          )}
          
          {consentData[signatureKey] && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearSignature()
              }}
              className="absolute -top-6 -right-2 text-xs text-red-600 hover:text-red-700 bg-white px-1 py-0.5 rounded shadow text-[10px]"
            >
              지우기
            </button>
          )}
        </div>

        {/* 날짜1 표시 - 첫 번째 줄 날짜란 */}
        <div
          className="text-black font-medium text-center flex items-center justify-center"
          style={getCoordinateStyle('date1')}
        >
          {consentData.date}
        </div>

        {/* 연구원 정보는 사용자에게 표시하지 않음 - PDF 생성 시에만 사용 */}
      </div>
      
      {/* 확대된 서명 모달 */}
      {isSignatureExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">서명하기</h3>
              <button
                onClick={closeSignatureModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="border-2 border-gray-300 rounded-lg bg-gray-50 mb-4 relative">
              <SignatureCanvas
                ref={expandedSigRef}
                penColor="black"
                canvasProps={{
                  width: containerWidth > 600 ? 800 : containerWidth - 60,
                  height: containerWidth > 600 ? 300 : 200,
                  className: 'signature-canvas',
                  style: { 
                    width: '100%',
                    height: containerWidth > 600 ? '300px' : '200px',
                    touchAction: 'none'
                  }
                }}
                onEnd={handleSignatureEnd}
              />
              <div className="absolute top-2 left-2 text-xs text-gray-500">
                📝 여기에 서명해주세요
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={clearSignature}
                className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                서명 지우기
              </button>
              <button
                onClick={closeSignatureModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                서명 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
