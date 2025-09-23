import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ConsentPDFData {
  survey_id: string
  participant_name: string
  participant_phone?: string
  consent_date: string
  researcher_name: string
  researcher_signature: string
  researcher_date: string
  consent_signature1: string
  consent_signature2: string
}

export function useConsentPDF() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)



  // 타임아웃 방지를 위한 PDF 생성 및 저장 함수
  const generateAndSavePDF = async (data: ConsentPDFData) => {
    const timeout = 30000 // 30초 타임아웃
    
    try {
      console.log('📄 동의서 PDF 생성 및 저장 시작 (30초 제한)')
      setGenerating(true)
      setError(null)

      // 타임아웃 래퍼
      const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('처리 시간 초과')), ms)
          )
        ])
      }

      // PDF 생성 (타임아웃 적용)
      console.log('📄 PDF 생성 중... (최대 20초)')
      const [tempPDF1, tempPDF2] = await withTimeout(
        Promise.all([
          generateConsentPDF(data, 1),
          generateConsentPDF(data, 2)
        ]), 
        20000 // 20초
      )
      console.log('✅ PDF 생성 완료')

      // DB 저장 (타임아웃 적용)
      console.log('💾 DB 저장 중... (최대 10초)')
      const { data: result, error } = await withTimeout(
        supabase
          .from('consent_pdfs')
          .insert({
            survey_id: data.survey_id,
            participant_name: data.participant_name,
            participant_phone: data.participant_phone,
            consent_date: data.consent_date,
            researcher_name: data.researcher_name,
            researcher_signature: data.researcher_signature,
            researcher_date: data.researcher_date,
            consent_signature1: data.consent_signature1,
            consent_signature2: data.consent_signature2,
            consent_form1_pdf: tempPDF1,
            consent_form2_pdf: tempPDF2
          })
          .select('id')
          .single(),
        10000 // 10초
      )

      if (error) {
        throw new Error(`저장 실패: ${error.message}`)
      }

      console.log('✅ 동의서 PDF 생성 및 저장 완료')
      return { success: true, data: result }

    } catch (error) {
      console.error('❌ PDF 생성/저장 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      
      // 타임아웃 에러 특별 처리
      if (errorMessage.includes('처리 시간 초과') || errorMessage.includes('timeout')) {
        setError('PDF 생성에 시간이 너무 오래 걸립니다. 관리자에게 문의하세요.')
        return { success: false, error: 'PDF 생성 시간 초과' }
      }
      
      setError(`PDF 생성에 실패했습니다: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setGenerating(false)
    }
  }

  // 실제 PDF 생성 함수
  const generateConsentPDF = async (data: ConsentPDFData, formNumber: 1 | 2): Promise<string> => {
    try {
      console.log(`🔧 동의서 ${formNumber} PDF 생성 시작...`, {
        participant: data.participant_name,
        hasSignature1: !!data.consent_signature1,
        hasSignature2: !!data.consent_signature2
      })

      // PDF 생성을 위한 임시 컨테이너 생성
      console.log(`📦 임시 컨테이너 생성 중...`)
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '992px' // 원본 이미지 크기
      tempContainer.style.height = '1403px'
      tempContainer.style.backgroundColor = 'white'
      document.body.appendChild(tempContainer)
      console.log(`✅ 임시 컨테이너 생성 완료`)

      // 동의서 이미지와 데이터를 HTML로 렌더링
      console.log(`🎨 HTML 템플릿 생성 중...`)
      const imageSrc = formNumber === 1 
        ? '/images/signature/agree-sig-1.png' 
        : '/images/signature/agree-sig-2.png'
      
      tempContainer.innerHTML = await createConsentHTML(
        imageSrc,
        data,
        formNumber
      )
      console.log(`✅ HTML 템플릿 생성 완료`)

      // html2canvas로 캡처 (최적화된 설정)
      console.log(`📸 html2canvas로 캡처 시작...`)
      const canvas = await html2canvas(tempContainer, {
        width: 992,
        height: 1403,
        scale: 1, // 스케일을 1로 낮춰서 빠르게
        useCORS: true,
        allowTaint: false,
        backgroundColor: 'white',
        logging: false // 로깅 비활성화로 성능 향상
      })
      console.log(`✅ 캔버스 캡처 완료`)

      // jsPDF로 PDF 생성
      console.log(`📄 jsPDF로 PDF 생성 시작...`)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [992, 1403]
      })

      // JPEG로 변환해서 파일 크기 줄이기
      const imgData = canvas.toDataURL('image/jpeg', 0.8) // 80% 품질
      pdf.addImage(imgData, 'JPEG', 0, 0, 992, 1403)

      // Base64로 변환
      console.log(`🔄 Base64 변환 중...`)
      const pdfBase64 = pdf.output('datauristring')
      console.log(`✅ Base64 변환 완료, 크기: ${pdfBase64.length} characters`)
      
      // 임시 컨테이너 제거
      document.body.removeChild(tempContainer)

      console.log(`🎉 동의서 ${formNumber} PDF 생성 완료`)
      return pdfBase64

    } catch (error) {
      console.error(`PDF 생성 오류 (동의서 ${formNumber}):`, error)
      throw error
    }
  }

  // 동의서 HTML 생성 함수
  const createConsentHTML = async (
    imageSrc: string, 
    data: ConsentPDFData, 
    formNumber: 1 | 2
  ): Promise<string> => {
    
    // 이미지맵 좌표 정의 (ConsentFormOverlay와 동일)
    const COORDINATES_SIG1 = {
      name1: { left: 139, top: 614, right: 340, bottom: 661 },
      signature1: { left: 390, top: 614, right: 590, bottom: 661 },
      date1: { left: 638, top: 630, right: 839, bottom: 660 },
      name2: { left: 137, top: 698, right: 337, bottom: 739 },
      signature2: { left: 392, top: 698, right: 590, bottom: 739 },
      date2: { left: 639, top: 709, right: 838, bottom: 740 }
    }

    const COORDINATES_SIG2 = {
      name1: { left: 139, top: 605, right: 340, bottom: 652 },
      signature1: { left: 390, top: 605, right: 590, bottom: 652 },
      date1: { left: 638, top: 621, right: 839, bottom: 651 },
      name2: { left: 137, top: 689, right: 337, bottom: 730 },
      signature2: { left: 392, top: 689, right: 590, bottom: 730 },
      date2: { left: 639, top: 700, right: 838, bottom: 731 }
    }

    const coordinates = formNumber === 1 ? COORDINATES_SIG1 : COORDINATES_SIG2

    const getPositionStyle = (coordKey: keyof typeof coordinates) => {
      const coord = coordinates[coordKey]
      return `
        position: absolute;
        left: ${coord.left}px;
        top: ${coord.top}px;
        width: ${coord.right - coord.left}px;
        height: ${coord.bottom - coord.top}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: black;
      `
    }

    return `
      <div style="position: relative; width: 992px; height: 1403px;">
        <img src="${imageSrc}" style="width: 100%; height: 100%; object-fit: contain;" />
        
        <!-- 참여자 성명 -->
        <div style="${getPositionStyle('name1')}">
          ${data.participant_name}
        </div>
        
        <!-- 참여자 서명 -->
        <div style="${getPositionStyle('signature1')}">
          <img src="${data.consent_signature1}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
        
        <!-- 참여자 날짜 -->
        <div style="${getPositionStyle('date1')}">
          ${data.consent_date}
        </div>
        
        <!-- 연구원 성명 -->
        <div style="${getPositionStyle('name2')}">
          ${data.researcher_name}
        </div>
        
        <!-- 연구원 서명 -->
        <div style="${getPositionStyle('signature2')}">
          <img src="${data.researcher_signature}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
        
        <!-- 연구원 날짜 -->
        <div style="${getPositionStyle('date2')}">
          ${data.researcher_date}
        </div>
      </div>
    `
  }




  return {
    generateAndSavePDF,
    generating,
    error
  }
}
