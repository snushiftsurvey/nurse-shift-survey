'use client'

import React, { useState } from 'react'

interface ConsentDownloaderProps {
  consentRecord: {
    id: string
    survey_id: string
    consent_date: string
    researcher_name: string
    researcher_signature: string
    researcher_date: string
    consent_form_pdf?: string
    created_at: string
  }
}

export default function ConsentDownloader({ consentRecord }: ConsentDownloaderProps) {
  const [downloading, setDownloading] = useState(false)

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      // PDF 데이터가 없으면 별도로 조회
      let pdfData = consentRecord.consent_form_pdf
      
      if (!pdfData) {
        console.log('📄 PDF 바이너리 데이터 별도 조회 시작...', consentRecord.id)
        
        const { supabase } = await import('@/lib/supabase')
        const { data: pdfRecord, error } = await supabase
          .from('consent_pdfs')
          .select('consent_form_pdf, consent_date, researcher_name')
          .eq('id', consentRecord.id)
          .single()
        
        if (error) {
          console.error('❌ PDF 바이너리 데이터 조회 실패:', error)
          alert('PDF 파일을 다운로드할 수 없습니다.')
          return
        }
        
        pdfData = pdfRecord?.consent_form_pdf
        
        if (!pdfData) {
          alert('PDF 파일이 존재하지 않습니다.')
          return
        }
        
        // 날짜 정보도 업데이트
        if (pdfRecord) {
          consentRecord.consent_date = pdfRecord.consent_date || consentRecord.consent_date
          consentRecord.researcher_name = pdfRecord.researcher_name || consentRecord.researcher_name
        }
        
        console.log('✅ PDF 바이너리 데이터 별도 조회 성공')
      }
      
      if (pdfData) {
        // 날짜를 YYYYMMDD 형식으로 변환 (2025.01.01 → 20250101)  
        const dateFormatted = (consentRecord.consent_date || '2025.01.01').replace(/\./g, '')
        const fileName = `동의서_${consentRecord.survey_id?.substring(0, 8) || 'unknown'}_${dateFormatted}.pdf`

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

  // PDF 바이너리 데이터가 없어도 consent_pdf 레코드가 있으면 PDF 존재
  const hasPDF = consentRecord.consent_form_pdf || consentRecord.id

  return (
    <div className="flex space-x-1">
      {hasPDF ? (
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 rounded text-xs transition-colors flex items-center"
          title="동의서 PDF 다운로드"
        >
          {downloading ? (
            '...'
          ) : (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              PDF
            </>
          )}
        </button>
      ) : (
        <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          없음
        </span>
      )}
    </div>
  )
}