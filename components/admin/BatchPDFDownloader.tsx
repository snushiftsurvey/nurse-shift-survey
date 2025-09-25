'use client'

import React, { useState } from 'react'
import JSZip from 'jszip'

interface BatchPDFDownloaderProps {
  surveys: Array<{
    id: string
    created_at: string
    consent_pdf?: Array<{
      consent_form_pdf: string
      created_at: string
    }>
  }>
}

interface DownloadProgress {
  current: number
  total: number
  status: 'preparing' | 'generating' | 'compressing' | 'downloading' | 'completed' | 'error'
  message: string
}

export default function BatchPDFDownloader({ surveys }: BatchPDFDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [batchSize] = useState(50) // 50개씩 분할

  // PDF가 있는 설문만 필터링
  const surveysWithPDF = surveys.filter(survey => 
    survey.consent_pdf && survey.consent_pdf.length > 0
  )

  const totalBatches = Math.ceil(surveysWithPDF.length / batchSize)

  const handleBatchDownload = async (batchIndex: number) => {
    if (isDownloading) return

    setIsDownloading(true)
    setProgress({
      current: 0,
      total: batchSize,
      status: 'preparing',
      message: `배치 ${batchIndex + 1}/${totalBatches} 준비 중...`
    })

    try {
      const startIndex = batchIndex * batchSize
      const endIndex = Math.min(startIndex + batchSize, surveysWithPDF.length)
      const batchSurveys = surveysWithPDF.slice(startIndex, endIndex)

      console.log(` 배치 ${batchIndex + 1} 다운로드 시작:`, {
        startIndex,
        endIndex,
        count: batchSurveys.length
      })

      // ZIP 파일 생성
      const zip = new JSZip()
      
      setProgress(prev => prev ? {
        ...prev,
        status: 'generating',
        message: `PDF 파일 처리 중... (0/${batchSurveys.length})`
      } : null)

      // 각 PDF를 ZIP에 추가
      for (let i = 0; i < batchSurveys.length; i++) {
        const survey = batchSurveys[i]
        const pdfData = survey.consent_pdf?.[0]
        
        if (pdfData?.consent_form_pdf) {
          try {
            // Base64 데이터에서 실제 데이터 부분만 추출
            const base64Data = pdfData.consent_form_pdf.split(',')[1] || pdfData.consent_form_pdf
            
            // 파일명 생성: 설문ID_날짜.pdf
            const date = new Date(pdfData.created_at)
            const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
            const fileName = `${survey.id}_${dateStr}.pdf`
            
            // ZIP에 파일 추가
            zip.file(fileName, base64Data, { base64: true })
            
        
          } catch (error) {
            console.error(`❌ PDF 처리 실패 (${survey.id}):`, error)
          }
        }

        // 진행률 업데이트
        setProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          message: `PDF 파일 처리 중... (${i + 1}/${batchSurveys.length})`
        } : null)
      }

      // ZIP 압축
      setProgress(prev => prev ? {
        ...prev,
        status: 'compressing',
        message: 'ZIP 파일 압축 중...'
      } : null)

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      // 다운로드
      setProgress(prev => prev ? {
        ...prev,
        status: 'downloading',
        message: 'ZIP 파일 다운로드 중...'
      } : null)

      const today = new Date()
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
      const zipFileName = `동의서_배치${batchIndex + 1}_${dateStr}.zip`

      // 다운로드 실행
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = zipFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setProgress(prev => prev ? {
        ...prev,
        status: 'completed',
        message: `✅ 배치 ${batchIndex + 1} 다운로드 완료! (${batchSurveys.length}개 파일)`
      } : null)


    } catch (error) {
      console.error('❌ 배치 다운로드 실패:', error)
      setProgress(prev => prev ? {
        ...prev,
        status: 'error',
        message: `❌ 다운로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      } : null)
    } finally {
      setTimeout(() => {
        setIsDownloading(false)
        setProgress(null)
      }, 3000) // 3초 후 상태 초기화
    }
  }

  const handleDownloadAll = async () => {
    if (isDownloading) return

    for (let i = 0; i < totalBatches; i++) {
      await handleBatchDownload(i)
      
      // 배치 간 1초 대기 (브라우저 부하 방지)
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  if (surveysWithPDF.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm">다운로드할 PDF가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">PDF 분할 다운로드</h3>
          <p className="text-sm text-gray-600">
            총 {surveysWithPDF.length}개 PDF • {totalBatches}개 배치 (배치당 최대 {batchSize}개)
          </p>
        </div>
      </div>

      {/* 진행률 표시 */}
      {progress && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">{progress.message}</span>
            <span className="text-xs text-blue-700">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 배치별 다운로드 버튼 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {Array.from({ length: totalBatches }, (_, index) => {
          const startIndex = index * batchSize
          const endIndex = Math.min(startIndex + batchSize, surveysWithPDF.length)
          const count = endIndex - startIndex

          return (
            <button
              key={index}
              onClick={() => handleBatchDownload(index)}
              disabled={isDownloading}
              className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="text-left">
                <div className="font-medium text-sm text-gray-900">
                  배치 {index + 1}
                </div>
                <div className="text-xs text-gray-500">
                  {count}개 파일
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </button>
          )
        })}
      </div>

      {/* 전체 다운로드 버튼 */}
      {totalBatches > 1 && (
        <button
          onClick={handleDownloadAll}
          disabled={isDownloading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          {isDownloading ? '다운로드 중...' : `전체 다운로드 (${totalBatches}개 배치)`}
        </button>
      )}
    </div>
  )
}
