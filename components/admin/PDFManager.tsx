'use client'

import { useState } from 'react'
import { useConsentPDF } from '@/hooks/useConsentPDF'

interface PDFManagerProps {
  consentRecord: {
    id: string
    survey_id: string
    consent_date: string
    researcher_name: string
    researcher_signature: string
    researcher_date: string
    consent_form1_pdf?: string
    consent_form2_pdf?: string
    pdf_status: string
    error_message?: string
    pdf_url?: string
    consent_signature1?: string
    consent_signature2?: string
    created_at: string
    updated_at?: string
  }
  onPDFGenerated?: () => void  // PDF 생성 완료 시 콜백
}

export default function PDFManager({ consentRecord, onPDFGenerated }: PDFManagerProps) {
  const { generateAndSavePDF, generating, error } = useConsentPDF()
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPDF(true)
      console.log('🔄 관리자에서 PDF 재생성 시작:', consentRecord.survey_id)
      
      // PDF 재생성을 위한 데이터 구성
      const pdfData = {
        survey_id: consentRecord.survey_id,
        participant_name_signature: consentRecord.consent_signature1 || '',
        consent_date: consentRecord.consent_date,
        researcher_name: consentRecord.researcher_name,
        researcher_signature: consentRecord.researcher_signature,
        researcher_date: consentRecord.researcher_date,
        consent_signature1: consentRecord.consent_signature1 || '',
        consent_signature2: consentRecord.consent_signature2 || consentRecord.consent_signature1 || ''
      }
      
      const result = await generateAndSavePDF(pdfData)
      
      if (result.success) {
        console.log('✅ PDF 재생성 완료')
        alert('PDF가 성공적으로 생성되었습니다.')
        onPDFGenerated?.() // 부모 컴포넌트에게 알림 (리프레시용)
      } else {
        console.error('❌ PDF 재생성 실패:', result.error)
        alert(`PDF 생성에 실패했습니다: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ PDF 재생성 중 오류:', error)
      alert(`PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleDownloadPDF = async (formNumber: 1 | 2) => {
    try {
      console.log(`📥 PDF ${formNumber} 다운로드 시작`)
      
      // PDF 데이터가 있으면 직접 다운로드
      const pdfData = formNumber === 1 ? consentRecord.consent_form1_pdf : consentRecord.consent_form2_pdf
      
      if (!pdfData) {
        alert('PDF 데이터가 없습니다.')
        return
      }
      
      // 파일 다운로드
      const link = document.createElement('a')
      link.href = pdfData
      link.download = `동의서${formNumber}_${consentRecord.survey_id.substring(0, 8)}_${consentRecord.consent_date.replace(/\./g, '')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error(`❌ PDF ${formNumber} 다운로드 오류:`, error)
      alert(`PDF 다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  const getStatusBadge = () => {
    switch (consentRecord.pdf_status) {
      case 'success':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            생성완료
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            생성대기
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            생성실패
          </span>
        )
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            알 수 없음
          </span>
        )
    }
  }

  const hasPDFData = consentRecord.consent_form1_pdf && consentRecord.consent_form2_pdf
  const hasSignatureData = consentRecord.consent_signature1 && consentRecord.consent_signature2

  return (
    <div className="space-y-2">
      {/* PDF 상태 표시 */}
      <div className="flex items-center space-x-2">
        {getStatusBadge()}
        {consentRecord.updated_at && (
          <span className="text-xs text-gray-500">
            {new Date(consentRecord.updated_at).toLocaleString('ko-KR')}
          </span>
        )}
      </div>

      {/* 오류 메시지 표시 */}
      {consentRecord.pdf_status === 'failed' && consentRecord.error_message && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <p className="text-xs text-red-700">
            <strong>오류:</strong> {consentRecord.error_message}
          </p>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex flex-wrap gap-1">
        {/* PDF 생성/재생성 버튼 */}
        {hasSignatureData && (
          <button
            onClick={handleGeneratePDF}
            disabled={generatingPDF || generating}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              generatingPDF || generating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            title={consentRecord.pdf_status === 'success' ? 'PDF 재생성' : 'PDF 생성'}
          >
            {generatingPDF || generating ? '생성 중...' : (
              consentRecord.pdf_status === 'success' ? '재생성' : 'PDF 생성'
            )}
          </button>
        )}

        {/* PDF 다운로드 버튼들 */}
        {hasPDFData && consentRecord.pdf_status === 'success' && (
          <>
            <button
              onClick={() => handleDownloadPDF(1)}
              className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              title="첫 번째 동의서 PDF 다운로드"
            >
              동의서1
            </button>
            <button
              onClick={() => handleDownloadPDF(2)}
              className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              title="두 번째 동의서 PDF 다운로드"
            >
              동의서2
            </button>
          </>
        )}
      </div>

      {/* 상세 정보 (디버깅용) */}
      <div className="text-xs text-gray-500">
        <div>연구원: {consentRecord.researcher_name}</div>
        <div>
          서명데이터: {hasSignatureData ? '있음' : '없음'} | 
          PDF데이터: {hasPDFData ? '있음' : '없음'}
        </div>
      </div>
    </div>
  )
}
