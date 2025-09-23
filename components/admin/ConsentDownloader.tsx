'use client'

import React, { useState } from 'react'

interface ConsentPDFRecord {
  id: string
  survey_id: string
  participant_name: string
  participant_phone?: string
  consent_date: string
  researcher_name: string
  researcher_signature: string
  researcher_date: string
  consent_form1_pdf: string
  consent_form2_pdf: string
  created_at: string
}

interface ConsentDownloaderProps {
  consentRecord: ConsentPDFRecord
}

export default function ConsentDownloader({ consentRecord }: ConsentDownloaderProps) {
  const [downloading, setDownloading] = useState(false)

  const downloadPDF = async (pdfNumber: 1 | 2) => {
    setDownloading(true)
    try {
      const pdfData = pdfNumber === 1 ? consentRecord.consent_form1_pdf : consentRecord.consent_form2_pdf
      if (pdfData) {
        const fileName = `동의서${pdfNumber}_${consentRecord.participant_name}_${consentRecord.consent_date}.pdf`
        const base64Data = pdfData.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error(`PDF${pdfNumber} 다운로드 오류:`, error)
      alert('PDF 다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  const hasPDFs = consentRecord.consent_form1_pdf && consentRecord.consent_form2_pdf

  return (
    <div className="flex space-x-1">
      {hasPDFs ? (
        <>
          <button
            onClick={() => downloadPDF(1)}
            disabled={downloading}
            className="px-1 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded text-xs transition-colors"
            title="첫 번째 동의서 PDF"
          >
            PDF1
          </button>
          <button
            onClick={() => downloadPDF(2)}
            disabled={downloading}
            className="px-1 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded text-xs transition-colors"
            title="두 번째 동의서 PDF"
          >
            PDF2
          </button>
        </>
      ) : (
        <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          없음
        </span>
      )}
    </div>
  )
}