'use client'

import { useState, useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface UnifiedSignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { name: string; signature: string }) => void
  initialData?: {
    name?: string
    signature?: string
  }
}

export default function UnifiedSignatureModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialData 
}: UnifiedSignatureModalProps) {
  const [currentStep, setCurrentStep] = useState(1) // 1: 성명, 2: 서명
  const [nameSignature, setNameSignature] = useState('')
  const [signature, setSignature] = useState('')
  
  const nameCanvasRef = useRef<SignatureCanvas>(null)
  const signatureCanvasRef = useRef<SignatureCanvas>(null)
  const nameContainerRef = useRef<HTMLDivElement>(null)
  const signatureContainerRef = useRef<HTMLDivElement>(null)

  // 모달이 열릴 때 초기 데이터 설정
  useEffect(() => {
    if (isOpen && initialData) {
      setNameSignature(initialData.name || '')
      setSignature(initialData.signature || '')
      
      // 기존 데이터가 있으면 마지막 단계로 이동
      if (initialData.name && initialData.signature) {
        setCurrentStep(3) // 확인 단계
      }
    } else if (isOpen) {
      // 새로 시작하는 경우 초기화
      setCurrentStep(1)
      setNameSignature('')
      setSignature('')
    }
  }, [isOpen, initialData])

  // 모바일 뷰포트 리셋
  const resetMobileViewport = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    
    const viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      setTimeout(() => {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimum-scale=1.0')
      }, 100)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      // 성명 저장
      if (nameCanvasRef.current && !nameCanvasRef.current.isEmpty()) {
        setNameSignature(nameCanvasRef.current.toDataURL('image/png'))
        setCurrentStep(2)
        resetMobileViewport()
      } else {
        alert('성명을 입력해주세요.')
      }
    } else if (currentStep === 2) {
      // 서명 저장
      if (signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()) {
        setSignature(signatureCanvasRef.current.toDataURL('image/png'))
        setCurrentStep(3)
        resetMobileViewport()
      } else {
        alert('서명을 입력해주세요.')
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      resetMobileViewport()
    }
  }

  const handleClear = () => {
    if (currentStep === 1 && nameCanvasRef.current) {
      nameCanvasRef.current.clear()
    } else if (currentStep === 2 && signatureCanvasRef.current) {
      signatureCanvasRef.current.clear()
    }
  }

  const handleConfirm = () => {
    onConfirm({
      name: nameSignature,
      signature: signature
    })
    onClose()
  }

  const handleCancel = () => {
    setCurrentStep(1)
    setNameSignature('')
    setSignature('')
    onClose()
  }

  if (!isOpen) return null

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return '성명을 정자로 기재해주세요'
      case 2: return '서명을 해주세요'
      case 3: return '입력 내용을 확인해주세요'
      default: return ''
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return '펜으로 성명을 직접 써주세요'
      case 2: return '동의서에 들어갈 서명을 해주세요'
      case 3: return '모든 입력이 완료되었습니다. 확인 후 동의서에 적용됩니다.'
      default: return ''
    }
  }

  // 카카오톡 인앱 브라우저 터치 이벤트 제어 (성명)
  useEffect(() => {
    if (!isOpen || currentStep !== 1) return
    
    const container = nameContainerRef.current
    if (!container) return

    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        startY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return
      
      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY
      
      // Pull-to-Refresh만 차단 (아래로 당기는 동작)
      if (deltaY > 5 && window.scrollY === 0) {
        e.preventDefault()
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isOpen, currentStep])

  // 카카오톡 인앱 브라우저 터치 이벤트 제어 (서명)
  useEffect(() => {
    if (!isOpen || currentStep !== 2) return
    
    const container = signatureContainerRef.current
    if (!container) return

    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        startY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return
      
      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY
      
      // Pull-to-Refresh만 차단 (아래로 당기는 동작)
      if (deltaY > 5 && window.scrollY === 0) {
        e.preventDefault()
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isOpen, currentStep])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-white z-50 flex items-center justify-center" 
      style={{
        width: '100vw',
        height: '100dvh',
        overscrollBehavior: 'none',
        overscrollBehaviorY: 'none',
        touchAction: 'none',
        position: 'fixed',
        WebkitOverflowScrolling: 'auto'
      }}
    >
      <div className="w-full max-w-md mx-auto p-6 flex flex-col h-full">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{getStepTitle()}</h2>
          <p className="text-sm text-gray-600">{getStepDescription()}</p>
          <div className="flex justify-center mt-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full mx-1 ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col">
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col">
              <div 
                ref={nameContainerRef}
                className="border-2 border-gray-300 rounded-lg bg-white signature-input-area" 
                style={{ 
                  height: '150px', 
                  touchAction: 'none',
                  overscrollBehavior: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                <SignatureCanvas
                  ref={nameCanvasRef}
                  canvasProps={{
                    className: 'w-full h-full',
                    style: { width: '100%', height: '150px' }
                  }}
                  minWidth={3}
                  maxWidth={6}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex-1 flex flex-col">
              <div 
                ref={signatureContainerRef}
                className="border-2 border-gray-300 rounded-lg bg-white signature-input-area" 
                style={{ 
                  height: '150px', 
                  touchAction: 'none',
                  overscrollBehavior: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                <SignatureCanvas
                  ref={signatureCanvasRef}
                  canvasProps={{
                    className: 'w-full h-full',
                    style: { width: '100%', height: '150px' }
                  }}
                  minWidth={3}
                  maxWidth={6}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex-1 flex flex-col space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">입력된 내용:</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">성명:</p>
                    <div className="border rounded bg-white p-2 h-16 flex items-center justify-center">
                      {nameSignature && (
                        <img src={nameSignature} alt="성명" className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">서명:</p>
                    <div className="border rounded bg-white p-2 h-16 flex items-center justify-center">
                      {signature && (
                        <img src={signature} alt="서명" className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="mt-6 flex justify-between">
          {currentStep < 3 ? (
            <>
              <div className="flex space-x-2">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    이전
                  </button>
                )}
                <button
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  지우기
                </button>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  다음
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                수정
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  확인
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
