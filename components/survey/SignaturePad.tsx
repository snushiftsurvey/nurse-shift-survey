'use client'

import React, { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignaturePadProps {
  onSignatureChange: (signatureData: string) => void
  signatureData?: string
}

export default function SignaturePad({ onSignatureChange, signatureData }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (signatureData && sigRef.current) {
      sigRef.current.fromDataURL(signatureData)
      setIsEmpty(false)
    }
  }, [signatureData])

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
    <div className="space-y-4">
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
            canvasProps={{
              width: 400,
              height: 150,
              className: 'signature-canvas w-full border-0',
              style: { touchAction: 'none' }
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
