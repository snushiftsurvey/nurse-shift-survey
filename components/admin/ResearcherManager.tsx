'use client'

import React, { useState, useRef } from 'react'
import { useResearcher } from '@/hooks/useResearcher'
import SignatureCanvas from 'react-signature-canvas'

export default function ResearcherManager() {
  const { researcher, loading, error, updateResearcher } = useResearcher()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ name: '', signature: '' })
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const sigRef = useRef<SignatureCanvas>(null)

  React.useEffect(() => {
    if (researcher) {
      setEditData({
        name: researcher.name,
        signature: researcher.signature_image
      })
    }
  }, [researcher])

  const handleSave = async () => {
    if (!editData.name.trim()) {
      alert('연구원 이름을 입력해주세요.')
      return
    }

    if (!editData.signature.trim()) {
      alert('서명을 등록해주세요.')
      return
    }

    const result = await updateResearcher(editData.name, editData.signature)
    
    if (result.success) {
      setIsEditing(false)
      alert('연구원 정보가 업데이트되었습니다.')
    } else {
      alert(result.error || '업데이트에 실패했습니다.')
    }
  }

  const handleSignatureComplete = () => {
    if (sigRef.current) {
      const signatureData = sigRef.current.toDataURL()
      setEditData(prev => ({ ...prev, signature: signatureData }))
      setShowSignatureModal(false)
    }
  }

  const clearSignature = () => {
    if (sigRef.current) {
      sigRef.current.clear()
    }
  }

  if (loading) {
    return <div className="p-4">연구원 정보를 불러오는 중...</div>
  }

  if (error) {
    return <div className="p-4 text-red-600">오류: {error}</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">연구원 정보 관리</h3>
      
      {!isEditing ? (
        // 보기 모드
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">연구원 이름</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border">
              {researcher?.name || '등록된 연구원이 없습니다.'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">등록된 서명</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border h-20 flex items-center justify-center">
              {researcher?.signature_image ? (
                <img 
                  src={researcher.signature_image} 
                  alt="등록된 서명" 
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-gray-400">등록된 서명이 없습니다.</span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            정보 수정
          </button>
        </div>
      ) : (
        // 편집 모드
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">연구원 이름</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="연구원 이름을 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">서명</label>
            <div className="mt-1 p-2 bg-gray-50 rounded border h-20 flex items-center justify-center relative">
              {editData.signature ? (
                <>
                  <img 
                    src={editData.signature} 
                    alt="서명 미리보기" 
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="absolute top-1 right-1 text-xs bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    변경
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  서명 등록하기
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              저장
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              취소
            </button>
          </div>
        </div>
      )}
      
      {/* 서명 모달 */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h4 className="text-lg font-medium mb-4">서명 등록</h4>
            
            <div className="border-2 border-gray-300 rounded-lg mb-4">
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                  width: 600,
                  height: 200,
                  className: 'signature-canvas',
                  style: { width: '100%', height: '200px' }
                }}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSignatureComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                서명 저장
              </button>
              <button
                onClick={clearSignature}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                지우기
              </button>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
