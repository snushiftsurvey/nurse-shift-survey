'use client'

import React, { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignaturePadProps {
  onSignatureChange: (signatureData: string) => void
  signatureData?: string
}

export default function SignaturePad({ onSignatureChange, signatureData }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (signatureData && sigRef.current) {
      sigRef.current.fromDataURL(signatureData)
      setIsEmpty(false)
    }
  }, [signatureData])

  // 터치 이벤트 격리 (Pull-to-Refresh 방지 강화 - 0d3a317 버전)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startY = 0

    const preventPullToRefresh = (e: TouchEvent) => {
      // 서명패드 영역에서는 모든 기본 터치 동작 차단
      if (e.touches.length === 1) {
        e.preventDefault() // 기본 동작 완전 차단
        e.stopPropagation()
      }
      // 멀티터치(줌, 핀치)는 방지
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      preventPullToRefresh(e)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY
      
      // 위로 스크롤(Pull-to-Refresh) 동작 완전 차단
      if (deltaY > 0) {
        e.preventDefault()
        e.stopPropagation()
      } else {
        preventPullToRefresh(e)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', preventPullToRefresh, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', preventPullToRefresh)
    }
  }, [])

  const clear = () => {
    if (sigRef.current) {
      sigRef.current.clear()
      setIsEmpty(true)
      onSignatureChange('')
    }
  }

  const save = () => {
    if (sigRef.current) {
      const signatureData = sigRef.current.getTrimmedCanvas().toDataURL('image/png')
      onSignatureChange(signatureData)
    }
  }

  const handleEnd = () => {
    if (sigRef.current) {
      setIsEmpty(sigRef.current.isEmpty())
      if (!sigRef.current.isEmpty()) {
        save()
      }
    }
  }

  return (
    <div className="space-y-4 signature-input-area" ref={containerRef}>
      <div className="border border-gray-300 rounded-lg bg-white">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">서명</span>
            <button
              type="button"
              onClick={clear}
              className="text-sm text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
            >
              지우기
            </button>
          </div>
        </div>
        
        <div className="relative">
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            minWidth={2}
            maxWidth={4}
            canvasProps={{
              width: 400,
              height: 150,
              className: 'signature-canvas w-full border-0',
              style: { 
                touchAction: 'none',
                overscrollBehavior: 'contain',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none'
              }
            }}
            onEnd={handleEnd}
          />
          
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-gray-400 text-sm">여기에 서명해주세요</span>
            </div>
          )}
        </div>
      </div>
      
      {!isEmpty && (
        <div className="text-xs text-green-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          서명이 완료되었습니다
        </div>
      )}
    </div>
  )
}
