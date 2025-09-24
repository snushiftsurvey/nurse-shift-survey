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

  // PDF 좌표 체계(기준: 992 x 1403)와 동일하게 사용
  const BASE_WIDTH = 992
  const BASE_HEIGHT = 1403

  const COORDINATES_SIG1 = {
    name1: { left: 139, top: 614, right: 340, bottom: 661 },
    signature1: { left: 390, top: 614, right: 590, bottom: 661 },
    date1: { left: 638, top: 630, right: 839, bottom: 660 },
    name2: { left: 137, top: 698, right: 337, bottom: 739 },
    signature2: { left: 392, top: 698, right: 590, bottom: 739 },
    date2: { left: 639, top: 709, right: 838, bottom: 740 }
  }

  const COORDINATES_SIG2 = {
    name1: { left: 139, top: 588, right: 340, bottom: 635 },
    signature1: { left: 390, top: 588, right: 590, bottom: 635 },
    date1: { left: 638, top: 604, right: 839, bottom: 634 },
    name2: { left: 137, top: 672, right: 337, bottom: 713 },
    signature2: { left: 392, top: 672, right: 590, bottom: 713 },
    date2: { left: 639, top: 683, right: 838, bottom: 714 }
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
    <div className="relative w-full">
      {/* 동의서 이미지 (연구참여자용 설명문과 동일한 테두리 스타일) */}
      <div className="relative border border-gray-200 rounded-lg bg-white shadow-sm p-2">
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

        {/* 두 번째 서명 표시 영역 (동일한 서명 사용) */}
        {/* 연구자 서명 영역은 화면 프리뷰에서 표시하지 않음 (PDF에서만 연구자 서명 렌더링) */}

        {/* 날짜(참여자) - 화면에도 PDF와 동일한 위치 표시 */}
        {consentData.date && (
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

        {/* 웹 미리보기에서는 연구원/날짜 오버레이 숨김 (PDF에서만 렌더링) */}
      </div>

    </div>
  )
}