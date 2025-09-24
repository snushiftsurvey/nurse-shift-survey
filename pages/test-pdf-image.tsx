import { useState } from 'react'
import Head from 'next/head'

export default function TestPDFImage() {
  const [imageData, setImageData] = useState('')
  const [status, setStatus] = useState('')

  const loadImageFromDB = async () => {
    try {
      setStatus('🔄 이미지 로드 중...')
      const response = await fetch('/api/test-researcher-signature')
      const data = await response.json()
      
      if (data.signature_image) {
        setImageData(data.signature_image)
        setStatus(`✅ 이미지 로드 완료: ${data.format}, 길이: ${data.length}자`)
      } else {
        setStatus('❌ 이미지 데이터 없음')
      }
    } catch (error) {
      setStatus(`❌ 로드 오류: ${error.message}`)
    }
  }

  const generatePDF = async () => {
    if (!imageData) {
      alert('먼저 이미지를 로드해주세요')
      return
    }
    
    try {
      setStatus('📄 PDF 생성 중...')
      
      // html2canvas와 jsPDF 동적 로드
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).jsPDF
      
      const element = document.getElementById('testContent')
      if (!element) {
        throw new Error('테스트 요소를 찾을 수 없습니다')
      }
      
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        allowTaint: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [400, 200]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, 400, 200)
      
      // PDF 다운로드
      pdf.save('test-signature.pdf')
      
      setStatus('✅ PDF 생성 완료')
      
    } catch (error) {
      setStatus(`❌ PDF 생성 오류: ${error.message}`)
      console.error('PDF 생성 오류:', error)
    }
  }

  return (
    <>
      <Head>
        <title>PDF 이미지 테스트</title>
      </Head>
      
      <div style={{ padding: '20px' }}>
        <h1>PDF 이미지 테스트</h1>
        
        <div 
          id="testContent" 
          style={{ 
            width: '400px', 
            height: '200px', 
            border: '1px solid black', 
            position: 'relative',
            margin: '20px 0'
          }}
        >
          <div style={{ position: 'absolute', top: '50px', left: '50px' }}>
            {imageData && (
              <img 
                src={imageData} 
                alt="테스트 이미지" 
                style={{ 
                  maxWidth: '100px', 
                  maxHeight: '50px', 
                  border: '1px solid red' 
                }} 
              />
            )}
          </div>
          <div style={{ position: 'absolute', top: '120px', left: '50px' }}>
            <span>연구원: 정수인</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={loadImageFromDB}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            DB에서 이미지 로드
          </button>
          <button 
            onClick={generatePDF}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            PDF 생성
          </button>
        </div>
        
        <div 
          style={{ 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            minHeight: '50px'
          }}
        >
          {status || '상태 메시지가 여기에 표시됩니다.'}
        </div>
      </div>
    </>
  )
}
