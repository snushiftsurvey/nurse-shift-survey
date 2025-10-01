import { useState } from 'react'
import { supabasePublic } from '@/lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ConsentPDFData {
  survey_id: string
  participant_name_signature: string
  consent_date: string
  researcher_name: string
  researcher_signature: string
  researcher_date: string
  consent_signature1: string
  consent_signature2: string // 호환성 유지 (signature1과 동일한 값)
}

export function useConsentPDF() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)



  // 타임아웃 방지를 위한 PDF 생성 및 저장 함수
  const generateAndSavePDF = async (data: ConsentPDFData) => {
    const timeout = 30000 // 30초 타임아웃
    
    try {
      console.log('📄 동의서 PDF 생성 및 저장 시작 (30초 제한)')
      
      // 🔍 환경 변수 확인 (배포 디버깅용)
      console.log('🔧 환경 변수 상태 확인:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '누락됨',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '누락됨',
        urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      })
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

      // 연구원 정보는 저장 직전에 DB에서 확정값으로 재조회해 사용
      try {
        const { data: researcherRow, error: researcherErr } = await supabasePublic
          .from('researcher_profiles')
          .select('name, signature_image')
          .eq('name', data.researcher_name)
          .single()

        if (!researcherErr && researcherRow?.signature_image) {
          data.researcher_name = researcherRow.name
          data.researcher_signature = researcherRow.signature_image
        }
      } catch (_) {
        // 조회 실패시 전달된 값을 그대로 사용 (생성은 계속 진행)
      }

      // PDF 생성 (2페이지로 합침, 타임아웃 적용)

      const combinedPDF = await withTimeout(
        generateCombinedConsentPDF(data), 
        20000 // 20초
      )

      const saveResult = await withTimeout(
        Promise.resolve(
          supabasePublic
            .from('consent_pdfs')
            .insert({
              survey_id: data.survey_id,
              participant_name_signature: data.participant_name_signature,
              consent_date: data.consent_date,
              researcher_name: data.researcher_name,
              researcher_signature: data.researcher_signature,
              researcher_date: data.researcher_date,
              consent_signature1: data.consent_signature1,
              consent_signature2: data.consent_signature2,
              consent_form_pdf: combinedPDF
            })
            .select('id')
            .single()
        ),
        10000 // 10초
      )
      
      const { data: result, error } = (saveResult as any)

      if (error) {
        throw new Error(`저장 실패: ${error.message}`)
      }

      console.log(' 동의서 PDF 생성 및 저장 완료')
      return { success: true, data: result }

    } catch (error) {
      console.error('❌ PDF 생성/저장 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      
      // 타임아웃 에러 특별 처리
      if (errorMessage.includes('처리 시간 초과') || errorMessage.includes('timeout')) {
        setError('PDF 생성에 시간이 너무 오래 걸립니다. 관리자에게 문의하세요.')
        return { success: false, error: 'PDF 생성 시간 초과' }
      }
      
      // 이미지 로드 에러 특별 처리
      if (errorMessage.includes('이미지 로드 실패')) {
        setError('동의서 이미지를 불러올 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.')
        return { success: false, error: '이미지 로드 실패' }
      }
      
      // CORS 에러 특별 처리
      if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
        setError('보안 정책으로 인해 PDF 생성에 실패했습니다. 관리자에게 문의하세요.')
        return { success: false, error: 'CORS 에러' }
      }
      
      // RLS 에러 특별 처리
      if (errorMessage.includes('row-level security')) {
        setError('데이터베이스 접근 권한 문제입니다. 관리자에게 문의하세요.')
        return { success: false, error: 'RLS 정책 에러' }
      }
      
      setError(`PDF 생성에 실패했습니다: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setGenerating(false)
    }
  }

  // 2페이지를 하나의 PDF로 합치는 함수
  const generateCombinedConsentPDF = async (data: ConsentPDFData): Promise<string> => {
    try {
      console.log('🔧 통합 동의서 PDF 생성 시작 (2페이지)...', {
        hasParticipantNameSignature: !!data.participant_name_signature,
        hasSignature1: !!data.consent_signature1,
        hasSignature2: !!data.consent_signature2,
        signature1Length: data.consent_signature1?.length || 0,
        signature2Length: data.consent_signature2?.length || 0,
        hasResearcherSignature: !!data.researcher_signature
      })

      // 서명 데이터 검증
      if (!data.consent_signature1) {
        throw new Error(`서명 데이터 누락: signature1=${!!data.consent_signature1}`)
      }
      
      // signature2가 없으면 signature1과 동일하게 설정 (호환성)
      if (!data.consent_signature2) {
        data.consent_signature2 = data.consent_signature1
      }

      if (!data.researcher_signature) {
        throw new Error('연구원 서명이 누락되었습니다.')
      }

      // 연구원 서명 데이터 유효성 검증
      if (data.researcher_signature.length < 200 || 
          data.researcher_signature === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/afh/8kAAAAASUVORK5CYII=') {
        throw new Error('연구원 서명 데이터가 올바르지 않습니다. (투명/빈 이미지 또는 손상된 데이터)')
      }

      // jsPDF 인스턴스 생성

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [992, 1403]
      })

      // 첫 번째 페이지 생성

      const page1Canvas = await generateConsentPageCanvas(data, 1)
      const page1ImgData = page1Canvas.toDataURL('image/png')
      pdf.addImage(page1ImgData, 'PNG', 0, 0, 992, 1403)

      // 두 번째 페이지 추가

      pdf.addPage()
      const page2Canvas = await generateConsentPageCanvas(data, 2)
      const page2ImgData = page2Canvas.toDataURL('image/png')
      pdf.addImage(page2ImgData, 'PNG', 0, 0, 992, 1403)

      // Base64로 변환

      const pdfBase64 = pdf.output('datauristring')

      return pdfBase64

    } catch (error) {
      console.error('❌ 통합 PDF 생성 오류:', error)
      throw error
    }
  }

  // 개별 동의서 페이지를 캔버스로 생성하는 함수
  const generateConsentPageCanvas = async (data: ConsentPDFData, formNumber: 1 | 2): Promise<HTMLCanvasElement> => {
    try {
      console.log(`🎯 동의서 ${formNumber} 캔버스 생성 시작`)

      // PDF 생성을 위한 임시 컨테이너 생성
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '-9999px'
      tempContainer.style.width = '992px'
      tempContainer.style.height = '1403px'
      tempContainer.style.backgroundColor = 'white'
      document.body.appendChild(tempContainer)
      console.log(`✅ 임시 컨테이너 생성 완료`)

      // 동의서 이미지와 데이터를 HTML로 렌더링
      const imageSrc = formNumber === 1 
        ? '/images/signature/agree-sig-1.png?v=20250924' 
        : '/images/signature/agree-sig-2.png?v=20250924'
      
      console.log(`🖼️ 이미지 경로: ${imageSrc}`)
      
      // 이미지 로드 테스트 (CORS 문제 대응)
      const testImage = new Image()
      testImage.crossOrigin = 'anonymous'
      
      const imageLoadPromise = new Promise<string>((resolve, reject) => {
        testImage.onload = () => {
          console.log(`✅ 이미지 로드 성공: ${imageSrc}`)
          
          // 이미지를 Base64로 변환 (CORS 문제 해결)
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas context를 생성할 수 없습니다')
            
            canvas.width = testImage.naturalWidth
            canvas.height = testImage.naturalHeight
            ctx.drawImage(testImage, 0, 0)
            
            const base64 = canvas.toDataURL('image/png')
            console.log(`✅ 이미지 Base64 변환 성공`)
            resolve(base64)
          } catch (conversionError) {
            console.warn(`⚠️ Base64 변환 실패, 원본 URL 사용:`, conversionError)
            resolve(imageSrc)
          }
        }
        testImage.onerror = (error) => {
          console.error(`❌ 이미지 로드 실패: ${imageSrc}`, error)
          reject(new Error(`이미지 로드 실패: ${imageSrc}`))
        }
        testImage.src = imageSrc
      })
      
      const resolvedImageSrc = await imageLoadPromise
      
      tempContainer.innerHTML = await createConsentHTML(
        resolvedImageSrc,
        data,
        formNumber
      )
      console.log(`✅ HTML 생성 완료`)

      // 서명 이미지들 로드 확인
      const signatureImages = tempContainer.querySelectorAll('img')

      
      // 모든 이미지가 로드될 때까지 대기
      const imageLoadPromises = Array.from(signatureImages).map((img, index) => {
        return new Promise<void>((resolve) => {
          if (img.complete) {
          
            resolve()
          } else {
            img.onload = () => {
              
              resolve()
            }
            img.onerror = () => {
              console.warn(`⚠️ 서명 이미지 ${index + 1} 로드 실패, 계속 진행`)
              resolve()
            }
          }
        })
      })
      
      await Promise.all(imageLoadPromises)

      // html2canvas로 캡처 (최적화된 설정)
  
      const canvas = await html2canvas(tempContainer, {
        width: 992,
        height: 1403,
        scale: 1,
        useCORS: true,
        allowTaint: true, // Base64 이미지 사용을 위해 allowTaint 허용
        backgroundColor: 'white',
        logging: true, // 배포 디버깅을 위해 로깅 활성화
        ignoreElements: (element) => {
          // 로드 실패한 이미지는 건너뛰기
          if (element.tagName === 'IMG' && !(element as HTMLImageElement).complete) {
            console.warn(`⚠️ 로드되지 않은 이미지 무시:`, (element as HTMLImageElement).src)
            return true
          }
          return false
        },
        onclone: (clonedDoc) => {
          console.log(`🔄 DOM 복제 완료`)
        }
      })

      
      // 임시 컨테이너 제거
      document.body.removeChild(tempContainer)

      return canvas

    } catch (error) {
      console.error(`❌ 캔버스 생성 오류 (동의서 ${formNumber}):`, error)
      console.error(`❌ 오류 상세:`, {
        message: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  // 기존 개별 PDF 생성 함수 (호환성을 위해 유지)
  const generateConsentPDF = async (data: ConsentPDFData, formNumber: 1 | 2): Promise<string> => {
    try {
      console.log(` 동의서 ${formNumber} PDF 생성 시작...`, {
        hasParticipantNameSignature: !!data.participant_name_signature,
        hasSignature1: !!data.consent_signature1,
        hasSignature2: !!data.consent_signature2
      })

      // PDF 생성을 위한 임시 컨테이너 생성

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

      const imageSrc = formNumber === 1 
        ? '/images/signature/agree-sig-1.png?v=20250924' 
        : '/images/signature/agree-sig-2.png?v=20250924'
      
      tempContainer.innerHTML = await createConsentHTML(
        imageSrc,
        data,
        formNumber
      )
      // html2canvas로 캡처 (최적화된 설정)
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
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, 992, 1403)

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
      // 화면에서는 signature2를 숨기지만, PDF에서는 researcher_signature만 배치
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
        
        <!-- 참여자 성명 (이미지) -->
        <div style="${getPositionStyle('name1')}">
          <img src="${data.participant_name_signature}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
        
        <!-- 참여자 서명 -->
        <div style="${getPositionStyle('signature1')}">
          <img src="${data.consent_signature1}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>
        
        <!-- 참여자 날짜 -->
        <div style="${getPositionStyle('date1')}">
          ${data.consent_date}
        </div>
        
        <!-- 연구원 성명 (서명 이미지로 표시) -->
        <div style="${getPositionStyle('name2')}">
          <img src="${data.researcher_signature}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
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
