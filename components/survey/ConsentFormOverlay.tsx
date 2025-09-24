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
  const lockedScrollYRef = useRef<number | null>(null)
  const getViewportWidth = () => (typeof window !== 'undefined' ? (window.visualViewport?.width || window.innerWidth) : 360)
  const [overlayOffset, setOverlayOffset] = useState({ left: 0, top: 0 })
  const [isNameInputExpanded, setIsNameInputExpanded] = useState(false)
  const [tempName, setTempName] = useState('')

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

  const lockBodyScroll = () => {
    try {
      const y = window.scrollY || 0
      lockedScrollYRef.current = y
      document.body.style.position = 'fixed'
      document.body.style.top = `-${y}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
    } catch {}
  }

  const unlockBodyScroll = () => {
    try {
      const y = lockedScrollYRef.current ?? 0
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      lockedScrollYRef.current = null
      window.scrollTo({ top: y, behavior: 'auto' })
    } catch {}
  }

  const openNameInputModal = () => {
    setTempName(consentData.name)
    lockBodyScroll()
    setIsNameInputExpanded(true)
  }

  const closeNameInputModal = () => {
    setIsNameInputExpanded(false)
    unlockBodyScroll()
  }

  const confirmNameInput = () => {
    onNameChange(tempName)
    closeNameInputModal()
  }

  const openSignatureModal = () => {

    
    // 강력한 모바일 줌 리셋
    resetMobileViewport()
    
    // 충분한 시간을 두고 모달 열기
    setTimeout(() => {
       
      lockBodyScroll()
      // iOS 사파리 등에서 키보드/줌으로 인해 layout/visual viewport가 어긋나는 문제를 보정
      const vv = window.visualViewport
      const syncOffset = () => {
        if (!window.visualViewport) return
        setOverlayOffset({
          left: Math.max(0, Math.floor(window.visualViewport.offsetLeft || 0)),
          top: Math.max(0, Math.floor(window.visualViewport.offsetTop || 0))
        })
      }
      syncOffset()
      vv?.addEventListener('resize', syncOffset)
      vv?.addEventListener('scroll', syncOffset)
      setIsSignatureExpanded(true)
      
      // 서명 데이터 로드
      setTimeout(() => {
        const currentSignature = consentData[signatureKey]
        if (expandedSigRef.current && currentSignature) {
          expandedSigRef.current.fromDataURL(currentSignature)
        }
      }, 150)
    }, 200) // 줌 리셋을 위한 충분한 대기 시간
  }

  // 모바일 브라우저 줌 상태를 강력하게 리셋하는 함수
  const resetMobileViewport = () => {
    try {
      
      // 1. 즉시 포커스 제거 (키보드 내리기)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }

      // 2. 스크롤을 약간 조정해서 브라우저가 줌을 인식하게 함
      const currentY = window.scrollY
      window.scrollTo({ top: currentY - 1, behavior: 'auto' })
      setTimeout(() => {
        window.scrollTo({ top: currentY, behavior: 'auto' })
      }, 10)

      // 3. viewport 메타태그 강제 리셋 (여러 단계로)
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport && viewport instanceof HTMLMetaElement) {
        const originalContent = viewport.content
        // 1단계: 줌 완전 비활성화
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no'
        
        // 2단계: 100ms 후 다시 설정
        setTimeout(() => {
          viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        }, 100)
        
        // 3단계: 500ms 후 원래 설정으로 복구
        setTimeout(() => {
          viewport.content = originalContent || 'width=device-width, initial-scale=1.0'
       
        }, 500)
      }

      // 4. 추가로 body 스타일 임시 조작
      const originalTransform = document.body.style.transform
      document.body.style.transform = 'scale(1)'
      setTimeout(() => {
        document.body.style.transform = originalTransform
      }, 200)

      console.log('📱 강력한 줌 리셋 완료')
    } catch (error) {
      console.error('❌ 줌 리셋 중 오류:', error)
    }
  }

  const closeSignatureModal = () => {
    setIsSignatureExpanded(false)
    unlockBodyScroll()
    const vv = window.visualViewport
    const noop = () => {}
    // 타입가드 회피용 no-op 등록 후 제거
    vv?.removeEventListener('resize', noop as any)
    vv?.removeEventListener('scroll', noop as any)
    setOverlayOffset({ left: 0, top: 0 })
  }

  // 이미지맵 좌표를 기반으로 정확한 위치 계산
  const IMAGE_WIDTH = 992   // 원본 이미지 너비
  const IMAGE_HEIGHT = 1403 // 원본 이미지 높이
  
  // 이미지맵 좌표 정의
  const COORDINATES_SIG1 = {
    // agree-sig-1.png?0924용 좌표 (서명칸 높이 기준으로 성명칸 높이 조정)
    name1: { left: 139, top: 614, right: 340, bottom: 661 },    // 성명1 (47px 높이)
    signature1: { left: 390, top: 614, right: 590, bottom: 661 }, // 서명1 (47px 높이)
    date1: { left: 638, top: 630, right: 839, bottom: 660 },    // 날짜1
    name2: { left: 137, top: 698, right: 337, bottom: 739 },    // 성명2 (41px 높이)
    signature2: { left: 392, top: 698, right: 590, bottom: 739 }, // 서명2 (41px 높이)
    date2: { left: 639, top: 709, right: 838, bottom: 740 }     // 날짜2
  }
  
  const COORDINATES_SIG2 = {
    // agree-sig-2.png용 좌표 (서명칸 높이 기준으로 성명칸 높이 조정) - 17px 위로 이동
    name1: { left: 139, top: 588, right: 340, bottom: 635 },    // 성명1 (47px 높이)
    signature1: { left: 390, top: 588, right: 590, bottom: 635 }, // 서명1 (47px 높이)
    date1: { left: 638, top: 604, right: 839, bottom: 634 },    // 날짜1
    name2: { left: 137, top: 672, right: 337, bottom: 713 },    // 성명2 (41px 높이)
    signature2: { left: 392, top: 672, right: 590, bottom: 713 }, // 서명2 (41px 높이)
    date2: { left: 639, top: 683, right: 838, bottom: 714 }     // 날짜2
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
        
        {/* 성명1 입력 필드 - 모바일 viewport 변화 방지를 위해 클릭 모달 방식 */}
        <div
          onClick={openNameInputModal}
          className={`border-1 border-gray-400 text-black font-medium px-1 text-center flex items-center justify-center rounded-sm cursor-pointer hover:bg-green-50 hover:bg-opacity-40 transition-colors ${
            consentData.name.trim() ? 'bg-transparent' : 'bg-green-50 bg-opacity-60 animate-pulse-input'
          }`}
          style={getCoordinateStyle('name1')}
        >
          {consentData.name || (
            <span className="text-green-600 opacity-70" style={{ fontSize: '11px' }}>성명 입력</span>
          )}
        </div>

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
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-green-600 sm:text-xs signature-guide-text font-medium" style={{ fontSize: '11px' }}>서명</span>
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
        <div 
          className="fixed inset-0 bg-white z-50 p-4 sm:p-8" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100vw',
            height: '100dvh',
            transform: `translate(${overlayOffset.left}px, ${overlayOffset.top}px)`,
            overscrollBehavior: 'contain' as any
          }}
        >
           <div 
            className="bg-white rounded-lg p-3 sm:p-6 overflow-auto flex flex-col"
             style={{
              width: 'min(90vw, 600px)',
              maxWidth: '600px',
               maxHeight: '70vh',
               margin: 'auto',
               transform: 'scale(1)', // 강제 스케일 고정
               transformOrigin: 'center center'
             }}
           >
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
                minWidth={2}
                maxWidth={4}
                 canvasProps={{
                   width: Math.min(560, Math.floor(getViewportWidth() * 0.85)),
                   height: getViewportWidth() < 600 ? 200 : 240,
                   className: 'signature-canvas',
                   style: { 
                     width: '100%',
                     height: getViewportWidth() < 600 ? '200px' : '240px',
                     touchAction: 'none',
                     display: 'block',
                     transform: 'scale(1)', // 캔버스 스케일 고정
                     transformOrigin: 'top left'
                   }
                 }}
                onEnd={handleSignatureEnd}
              />
              <div className="absolute top-2 left-2 text-xs text-gray-500 pointer-events-none">
                📝 여기에 서명해주세요
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
              <button
                onClick={clearSignature}
                className="flex-1 sm:flex-none px-4 py-3 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-center font-medium"
              >
                서명 지우기
              </button>
              <button
                onClick={closeSignatureModal}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                서명 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성명 입력 모달 - viewport 변화 방지 */}
      {isNameInputExpanded && (
        <div 
          className="fixed inset-0 bg-white z-50 p-4" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100vw',
            height: '100dvh'
          }}
        >
          <div 
            className="bg-white rounded-lg p-4 overflow-auto flex flex-col"
            style={{
              width: 'min(90vw, 400px)',
              maxWidth: '400px',
              margin: 'auto',
              transform: 'scale(1)',
              transformOrigin: 'center center'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">성명 입력</h3>
              <button
                onClick={closeNameInputModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="성명을 입력하세요"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg text-black"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={closeNameInputModal}
                className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmNameInput}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
