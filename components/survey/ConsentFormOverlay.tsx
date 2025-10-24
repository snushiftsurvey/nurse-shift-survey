'use client'

import React from 'react'
import Image from 'next/image'

interface ConsentFormOverlayProps {
  consentData: {
    name: string
    signature: string
    date: string
    agreed: boolean | null
  }
  onNameChange: (name: string) => void
  onSignatureChange: (signature: string) => void
  imageSrc: string  // 사용할 이미지 경로
  signatureKey: 'signature1' | 'signature2'  // 어떤 서명을 사용할지 (호환성 유지)
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

  // 새 이미지 좌표 체계 (실제 이미지 크기: 1654 x 2339)
  const BASE_WIDTH = 1654
  const BASE_HEIGHT = 2339

  const COORDINATES_SIG1 = {
    // 첫 번째 줄 (연구참여자)
    name1: { left: 270, top: 952, right: 606, bottom: 1000 },      // 성명: 너비 336, 높이 48 (아래로 10px)
    signature1: { left: 778, top: 946, right: 917, bottom: 994 },  // 서명: 너비 139, 높이 48 (아래로 10px)
    date1: { left: 1020, top: 959, right: 1266, bottom: 1007 },    // 날짜: 너비 246, 높이 48 (아래로 20px)
    // 두 번째 줄 (동의받는 연구원)
    name2: { left: 281, top: 1088, right: 617, bottom: 1136 },     // 성명: 너비 336, 높이 48 (아래로 10px)
    signature2: { left: 780, top: 1081, right: 919, bottom: 1129 }, // 서명: 너비 139, 높이 48 (아래로 10px)
    date2: { left: 1027, top: 1091, right: 1273, bottom: 1139 }    // 날짜: 너비 246, 높이 48 (아래로 20px)
  }

  const COORDINATES_SIG2 = {
    // 첫 번째 줄 (연구참여자)
    name1: { left: 270, top: 952, right: 606, bottom: 1000 },      // 성명: 너비 336, 높이 48 (아래로 10px)
    signature1: { left: 778, top: 946, right: 917, bottom: 994 },  // 서명: 너비 139, 높이 48 (아래로 10px)
    date1: { left: 1020, top: 959, right: 1266, bottom: 1007 },    // 날짜: 너비 246, 높이 48 (아래로 20px)
    // 두 번째 줄 (동의받는 연구원)
    name2: { left: 281, top: 1088, right: 617, bottom: 1136 },     // 성명: 너비 336, 높이 48 (아래로 10px)
    signature2: { left: 780, top: 1081, right: 919, bottom: 1129 }, // 서명: 너비 139, 높이 48 (아래로 10px)
    date2: { left: 1027, top: 1091, right: 1273, bottom: 1139 }    // 날짜: 너비 246, 높이 48 (아래로 20px)
  }

  // 좌표를 스타일로 변환하는 함수
  const getCoordinateStyle = (coordinateKey: keyof typeof COORDINATES_SIG1) => {
    const isForm2 = imageSrc.includes('agree-sig-2')
    const map = isForm2 ? COORDINATES_SIG2 : COORDINATES_SIG1
    const coordinates = map[coordinateKey]
    if (!coordinates) return {}
    const width = coordinates.right - coordinates.left
    const height = coordinates.bottom - coordinates.top
    return {
      position: 'absolute' as const,
      left: `${(coordinates.left / BASE_WIDTH) * 100}%`,
      top: `${(coordinates.top / BASE_HEIGHT) * 100}%`,
      width: `${(width / BASE_WIDTH) * 100}%`,
      height: `${(height / BASE_HEIGHT) * 100}%`,
    }
  }


  return (
    <div 
      className="relative w-full" 
      style={{ 
        touchAction: 'pan-y', 
        overscrollBehavior: 'contain',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* 동의서 이미지 (연구참여자용 설명문과 동일한 테두리 스타일) */}
      <div 
        className="relative border border-gray-200 rounded-lg bg-white shadow-sm p-2"
        style={{ 
          touchAction: 'pan-y', 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'auto'
        }}
      >
        <Image
          src={imageSrc}
          alt={title || "동의서"}
          width={800}
          height={600}
          className="w-full h-auto"
          priority
        />
        
        {/* 성명 표시 영역 */}
        {consentData.name && (
          <div
            className="absolute flex items-center justify-center"
            style={getCoordinateStyle('name1')}
          >
            <img 
              src={consentData.name} 
              alt="성명" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* 첫 번째 서명 표시 영역 */}
        {consentData.signature && (
          <div
            className="absolute flex items-center justify-center"
            style={getCoordinateStyle('signature1')}
          >
            <img 
              src={consentData.signature} 
              alt="서명1" 
              className="max-w-full max-h-full object-contain"
              style={{ filter: 'contrast(1.2)' }}
            />
          </div>
        )}

        {/* 날짜(참여자) - 서명 완료 후에만 표시 */}
        {consentData.date && consentData.signature && (
          <div
            className="absolute flex items-center justify-center font-medium"
            style={{
              ...getCoordinateStyle('date1'),
              fontSize: '11px', // 요청값 11px
              lineHeight: '1',
              color: '#000',
              WebkitTextSizeAdjust: '100%', // iOS Safari 텍스트 확대 방지
              textSizeAdjust: '100%'
            }}
          >
            {consentData.date}
          </div>
        )}

        {/* 🧪 테스트용: 동의받는 연구원 정보 표시 */}
        {researcherData && (
          <>
            {/* 연구원 성명 */}
            {researcherData.name && (
              <div
                className="absolute flex items-center justify-center"
                style={getCoordinateStyle('name2')}
              >
                <img 
                  src={researcherData.signature} 
                  alt="연구원 성명" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {/* 연구원 서명 */}
            {researcherData.signature && (
              <div
                className="absolute flex items-center justify-center"
                style={getCoordinateStyle('signature2')}
              >
                <img 
                  src={researcherData.signature} 
                  alt="연구원 서명" 
                  className="max-w-full max-h-full object-contain"
                  style={{ filter: 'contrast(1.2)' }}
                />
              </div>
            )}

            {/* 연구원 날짜 */}
            {researcherData.date && (
              <div
                className="absolute flex items-center justify-center font-medium"
                style={{
                  ...getCoordinateStyle('date2'),
                  fontSize: '11px',
                  lineHeight: '1',
                  color: '#000',
                  WebkitTextSizeAdjust: '100%',
                  textSizeAdjust: '100%'
                }}
              >
                {researcherData.date}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}