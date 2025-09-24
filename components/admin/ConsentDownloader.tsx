'use client'

import React, { useState } from 'react'

interface ConsentDownloaderProps {
  consentRecord: {
    id: string
    survey_id: string
    participant_name: string
    participant_phone?: string
    consent_date: string
    researcher_name: string
    researcher_signature: string
    researcher_date: string
    consent_form_pdf?: string
    consent_form1_pdf?: string // 호환성
    consent_form2_pdf?: string // 호환성
    created_at: string
  }
}

export default function ConsentDownloader({ consentRecord }: ConsentDownloaderProps) {
  const [downloading, setDownloading] = useState(false)

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      // 새로운 통합 PDF 또는 기존 첫 번째 PDF 사용
      const pdfData = consentRecord.consent_form_pdf || consentRecord.consent_form1_pdf
      if (pdfData) {
        // 날짜를 YYYYMMDD 형식으로 변환 (2025.01.01 → 20250101)
        const dateFormatted = consentRecord.consent_date.replace(/\./g, '')
        const fileName = `동의서_${consentRecord.participant_name}_${dateFormatted}.pdf`

        // 배포는 HTTPS 가정: data URI 직접 다운로드
        const link = document.createElement('a')
        link.href = pdfData // data:application/pdf;base64,...
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('PDF 다운로드 오류:', error)
      alert('PDF 다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  const hasPDF = consentRecord.consent_form_pdf || consentRecord.consent_form1_pdf

  return (
    <div className="flex space-x-1">
      {hasPDF ? (
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded text-xs transition-colors"
          title="동의서 PDF 다운로드"
        >
          {downloading ? '...' : 'PDF'}
        </button>
      ) : (
        <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          없음
        </span>
      )}
    </div>
  )
}