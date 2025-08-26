import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SurveyProvider } from '@/contexts/SurveyContext'

const spoqaHanSansNeo = localFont({
  src: [
    {
      path: '../public/font/SpoqaHanSansNeo-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/font/SpoqaHanSansNeo-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/font/SpoqaHanSansNeo-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/font/SpoqaHanSansNeo-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-spoqa',
})

export const metadata: Metadata = {
  title: '간호사 교대근무 설문조사',
  description: '서울대학교 간호대학 교대근무 간호사 2개월 근무표 수집 연구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${spoqaHanSansNeo.variable} ${spoqaHanSansNeo.className}`}>
        <SurveyProvider>
          {children}
        </SurveyProvider>
      </body>
    </html>
  )
}