'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CompletePage() {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // 페이지 로드 후 폭죽 효과 시작
    const timer = setTimeout(() => {
      setShowConfetti(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 폭죽 효과 */}
      {showConfetti && (
        <div className="fixed inset-0 w-full h-full pointer-events-none z-50 overflow-hidden">
          {/* 폭죽 이모지들 */}
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className={`absolute text-2xl md:text-4xl animate-bounce-up opacity-0`}
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                zIndex: 9999,
                filter: 'opacity(0.7)', // 모바일에서 투명도 적용
              }}
            >
              {['🎉', '🎊', '✨', '🌟', '💫', '🎆'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
          
          {/* 추가 파티클 효과 */}
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`particle-${i}`}
              className={`absolute w-2 h-2 md:w-4 md:h-4 rounded-full animate-float-up opacity-0`}
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'][Math.floor(Math.random() * 6)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                zIndex: 9998,
                filter: 'opacity(0.6)', // 모바일에서 투명도 적용
              }}
            />
          ))}
        </div>
      )}
      
      <div className="max-w-2xl mx-auto text-center relative z-20">
        <div className={`bg-white rounded-lg shadow-xl p-6 md:p-12 transition-all duration-700 ${showConfetti ? 'animate-pulse-once scale-105' : ''}`}>
          <div className="mb-8">
            <div className={`mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${showConfetti ? 'animate-bounce-gentle' : ''}`}>
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className={`text-xl md:text-4xl font-bold text-gray-900 mb-4 transition-all duration-700 ${showConfetti ? 'animate-celebration-text' : ''}`}>
              설문조사가 완료되었습니다! 🎉
            </h1>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-green-600 h-2 rounded-full w-full"></div>
            </div>
            <p className="text-sm text-gray-600">6단계 / 6단계 완료</p>
          </div>

          <div className="text-gray-600 mb-8 space-y-4">
            <p className="text-sm md:text-lg">
              소중한 시간을 내어 설문에 참여해 주셔서 감사합니다.
            </p>
            <p className="text-sm md:text-base">
              귀하의 응답은 간호사 근무환경 개선을 위한 <br/>
              중요한 연구 자료로 활용될 예정입니다.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 md:p-6 mb-8">
            <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
              기프티콘 안내
            </h2>
            <div className="text-gray-600 space-y-2 text-sm md:text-base">
              <p>•개인정보를 제공해주신 분들께는<br/> 모바일 기프티콘을 발송해드립니다.</p>
              <p>•개인정보는 기프티콘 발송 후 즉시 안전하게 폐기됩니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link 
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 md:py-3 px-6 md:px-8 rounded-lg transition-colors duration-200 text-sm md:text-base"
            >
              홈으로 돌아가기
            </Link>
            
            <p className="text-xs md:text-sm text-gray-500">
              문의사항이 있으시면 서울대학교 간호대학 조성현 교수 연구팀으로 연락주세요.
            </p>
          </div>
        </div>
      </div>
      
      {/* 커스텀 CSS 애니메이션 */}
      <style jsx>{`
        @keyframes bounce-up {
          0% {
            opacity: 0;
            transform: translateY(50px) scale(0.5);
          }
          25% {
            opacity: 0.5;
            transform: translateY(10px) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-30px) scale(1.2);
          }
          75% {
            opacity: 0.5;
            transform: translateY(-10px) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(0.7);
          }
        }
        
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(30px) rotate(0deg) scale(0.5);
          }
          20% {
            opacity: 0.4;
            transform: translateY(10px) rotate(72deg) scale(1);
          }
          40% {
            opacity: 0.6;
            transform: translateY(-20px) rotate(144deg) scale(1.1);
          }
          60% {
            opacity: 0.5;
            transform: translateY(-50px) rotate(216deg) scale(1);
          }
          80% {
            opacity: 0.3;
            transform: translateY(-80px) rotate(288deg) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) rotate(360deg) scale(0.6);
          }
        }
        
        /* 모바일에서 더 부드러운 효과 */
        @media (max-width: 768px) {
          .animate-bounce-up {
            filter: opacity(0.6) blur(0.5px);
          }
          
          .animate-float-up {
            filter: opacity(0.5) blur(0.5px);
          }
        }
        
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes celebration-text {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.05);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(1.05);
          }
        }
        
        @keyframes pulse-once {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .animate-bounce-up {
          animation: bounce-up forwards;
        }
        
        .animate-float-up {
          animation: float-up forwards;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out infinite;
        }
        
        .animate-celebration-text {
          animation: celebration-text 1s ease-in-out;
        }
        
        .animate-pulse-once {
          animation: pulse-once 1s ease-in-out;
        }
      `}</style>
    </div>
  )
}
