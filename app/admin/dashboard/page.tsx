'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import WorkScheduleViewer from '@/components/admin/WorkScheduleViewer'

interface SurveyData {
  id: string
  gender: string
  age: number
  hire_year: number
  hire_month: number
  medical_institution_type: string
  medical_institution_location: string
  department: string
  consent_personal_info: boolean
  created_at: string
  has_personal_info: boolean
  personal_info?: { id: string }[]
}

interface DetailedSurveyData extends SurveyData {
  work_types: any[]
  off_duty_types: any[]
  shift_data: any
  personal_info_data?: {
    name: string
    birth_date: string
    phone_number: string
  } | null
}



export default function AdminDashboardPage() {
  const [surveys, setSurveys] = useState<SurveyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSurvey, setSelectedSurvey] = useState<DetailedSurveyData | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  

  
  // 삭제 기능 관련 상태
  const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 실시간 DB 검증용 상태
  const [lastDeletedIds, setLastDeletedIds] = useState<string[]>([])
  const [realTimeValidation, setRealTimeValidation] = useState<{[key: string]: boolean}>({})
  
  // 🔐 인증 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // 정렬 상태 관리
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const router = useRouter()

  // 코드 값을 한국어로 변환하는 매핑 함수들
  const getGenderLabel = (gender: string) => {
    return gender === 'female' ? '여성' : gender === 'male' ? '남성' : gender
  }

  const getInstitutionTypeLabel = (type: string) => {
    switch (type) {
      case 'tertiary': return '상급종합병원'
      case 'general': return '종합병원'
      case 'hospital': return '병원'
      default: return type
    }
  }

  const getLocationLabel = (location: string) => {
    switch (location) {
      case 'seoul': return '서울'
      case 'incheon-gyeonggi': return '인천, 경기'
      case 'daejeon-sejong-chungcheong': return '대전, 세종, 충청'
      case 'gangwon': return '강원'
      case 'gwangju-jeolla': return '광주, 전라'
      case 'busan-daegu-gyeongsang': return '부산, 대구, 경상'
      case 'jeju': return '제주'
      default: return location
    }
  }

  const getDepartmentLabel = (department: string) => {
    switch (department) {
      case 'general-ward': return '일반병동'
      case 'icu': return '중환자실'
      case 'intensive-care-unit': return '중환자실'
      case 'integrated-care-ward': return '간호·간병통합서비스 병동'
      case 'emergency': return '응급실'
      case 'emergency-room': return '응급실'
      case 'operating-room': return '수술실'
      case 'outpatient-clinic': return '외래'
      case 'other': return '기타'
      default: return department
    }
  }

  // 정렬 함수
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 같은 필드 클릭 시 방향 토글
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // 다른 필드 클릭 시 해당 필드로 변경하고 기본은 내림차순
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // 정렬된 설문 데이터
  const sortedSurveys = [...surveys].sort((a, b) => {
    let aValue: any = a[sortField as keyof SurveyData]
    let bValue: any = b[sortField as keyof SurveyData]

    // 특별한 정렬 로직
    if (sortField === 'hire_date') {
      // 입사연월 정렬 (년도와 월을 조합)
      aValue = a.hire_year * 100 + a.hire_month
      bValue = b.hire_year * 100 + b.hire_month
    } else if (sortField === 'created_at') {
      // 날짜 정렬
      aValue = new Date(a.created_at).getTime()
      bValue = new Date(b.created_at).getTime()
    } else if (typeof aValue === 'string') {
      // 문자열 정렬 (한글 포함)
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1
    }
    return 0
  })

  // 정렬 아이콘 컴포넌트
  const SortIcon = ({ field }: { field: string }) => {
    const isActive = sortField === field
    
    return (
      <svg className={`w-4 h-4 ${isActive ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    )
  }

  // 특정 설문의 상세 정보 조회 (근무표 포함)
  const fetchSurveyDetail = async (surveyId: string) => {
    try {
      setScheduleLoading(true)

      const { data, error: fetchError } = await supabase
        .from('surveys')
        .select(`
          id,
          gender,
          age,
          hire_year,
          hire_month,
          medical_institution_type,
          medical_institution_location,
          department,
          consent_personal_info,
          created_at,
          work_types,
          off_duty_types,
          shift_data,
          personal_info(id, name, birth_date, phone_number)
        `)
        .eq('id', surveyId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const detailedSurvey: DetailedSurveyData = {
        ...data,
        has_personal_info: data.personal_info && data.personal_info.length > 0,
        personal_info_data: data.personal_info && data.personal_info.length > 0 ? data.personal_info[0] : null
      }

      setSelectedSurvey(detailedSurvey)
      setShowScheduleModal(true)
    } catch (err) {
      console.error('설문 상세 정보 조회 실패:', err)
      alert('설문 상세 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setScheduleLoading(false)
    }
  }



  // 설문 데이터 조회 (authenticated 사용자 전용)
  const fetchSurveys = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 인증된 사용자 - 실시간 DB 조회')
      console.log('👤 요청 사용자:', currentUser?.email)

      // 🔐 인증된 세션을 사용하므로 기존 supabase 클라이언트 사용
      // 캐시 방지를 위해 timestamp 쿼리 파라미터 추가
      const timestamp = Date.now()
      console.log('🕐 쿼리 타임스탬프:', timestamp)
      
      const { data, error: fetchError } = await supabase
        .from('surveys')
        .select(`
          id,
          gender,
          age,
          hire_year,
          hire_month,
          medical_institution_type,
          medical_institution_location,
          department,
          consent_personal_info,
          created_at,
          personal_info(id)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      console.log(`📊 authenticated 조회 결과:`, data?.length, '개')
      console.log('📋 조회된 데이터 ID들:', data?.map(s => s.id.substring(0, 8)))

      // personal_info 관계를 기반으로 has_personal_info 설정
      const surveysWithPersonalInfo = data?.map(survey => ({
        ...survey,
        has_personal_info: survey.personal_info && survey.personal_info.length > 0
      })) || []

      console.log(`✅ UI 설정 완료:`, surveysWithPersonalInfo.length, '개')
      setSurveys(surveysWithPersonalInfo)
      
    } catch (err) {
      console.error('설문 데이터 조회 실패:', err)
      setError('설문 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // CSV 다운로드 기능 (10월/11월 일별 근무표 포함)
  const handleExportCSV = async () => {
    try {
      console.log('📊 상세 엑셀 추출 시작...')
      
      // 모든 설문 데이터 (상세 정보 포함) 조회
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          personal_info(name, birth_date, phone_number)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('📋 추출할 설문 데이터:', data.length, '개')

      // 10월, 11월 날짜 배열 생성
      const generateDates = () => {
        const dates = []
        
        // 10월 (1-31일)
        for (let day = 1; day <= 31; day++) {
          dates.push(`2025-10-${day.toString().padStart(2, '0')}`)
        }
        
        // 11월 (1-30일)  
        for (let day = 1; day <= 30; day++) {
          dates.push(`2025-11-${day.toString().padStart(2, '0')}`)
        }
        
        return dates
      }

      const allDates = generateDates()
      console.log('📅 생성된 날짜 배열:', allDates.length, '개 (10월 31일 + 11월 30일)')

      // CSV 헤더 생성 (기본 정보 + 근무유형 정의 + 휴무유형 정의 + 일별 근무 열)
      const basicHeaders = [
        'ID', '의료기관', '소재지', '부서', '성별', '연령', '입사 연도', '입사월', 
        '성명', '생년월일', '휴대폰번호'
      ]
      
      // 근무유형 정의 헤더 (최대 4개 근무유형)
      const workTypeHeaders = []
      for (let i = 1; i <= 4; i++) {
        workTypeHeaders.push(`근무${i}`, `근무${i}시작`, `근무${i}종료`, `근무${i}휴게`)
      }
      
      // 휴무유형 정의 헤더
      const offDutyHeaders = ['휴무1', '휴무2']
      
      // 일별 근무 헤더 추가 (2025-10-01, 2025-10-02, ..., 2025-11-30)
      const dateHeaders = allDates.map(date => date)
      
      const headers = [...basicHeaders, ...workTypeHeaders, ...offDutyHeaders, ...dateHeaders].join(',')
      console.log('📋 헤더 생성 완료:', basicHeaders.length + workTypeHeaders.length + offDutyHeaders.length + dateHeaders.length, '개 열')

      // 근무유형 ID를 상세 정보로 변환하는 함수 (시간 정보 포함)
      const getShiftTypeDetail = (shiftId: string, workTypes: any[], offDutyTypes: any[]) => {
        // work_types에서 찾기
        const workType = workTypes?.find(wt => wt.id === shiftId)
        if (workType) {
          const startTime = workType.startTime || '미정'
          const endTime = workType.endTime || '미정'
          const breakInfo = workType.breakTime === 'custom' 
            ? (workType.customBreakTime || '미정')
            : workType.breakTime || '미정'
          
          return `${workType.name} (${startTime}-${endTime}, 휴게${breakInfo})`
        }
        
        // off_duty_types에서 찾기
        const offDutyType = offDutyTypes?.find(odt => odt.id === shiftId)
        if (offDutyType) {
          // 휴무는 시간 정보가 없으므로 이름만 반환
          const description = offDutyType.description ? ` (${offDutyType.description})` : ''
          return `${offDutyType.name}${description}`
        }
        
        // 찾지 못한 경우
        return '미정'
      }

      // CSV용 필드 이스케이프 함수 (쉼표, 따옴표, 줄바꿈 처리)
      const escapeCsvField = (field: any) => {
        const str = String(field || '')
        // 쉼표, 따옴표, 줄바꿈이 포함된 경우 따옴표로 감싸고 내부 따옴표는 이스케이프
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }



      // CSV 데이터 생성
      const csvData = data.map(survey => {
        console.log('🔍 처리 중인 설문 ID:', survey.id.substring(0, 8))
        
        // 기본 정보 (클라이언트 요청 순서대로 재배열)
        const basicData = [
          escapeCsvField(survey.id),
          escapeCsvField(getInstitutionTypeLabel(survey.medical_institution_type)),
          escapeCsvField(getLocationLabel(survey.medical_institution_location)),
          escapeCsvField(getDepartmentLabel(survey.department)),
          escapeCsvField(getGenderLabel(survey.gender)),
          escapeCsvField(survey.age),
          escapeCsvField(survey.hire_year),
          escapeCsvField(survey.hire_month),
          escapeCsvField(survey.personal_info?.[0]?.name || ''),
          escapeCsvField(survey.personal_info?.[0]?.birth_date || ''),
          `="${survey.personal_info?.[0]?.phone_number || ''}"`
        ]
        
        // 근무유형 정의 데이터 (최대 4개)
        const workTypes = survey.work_types || []
        const workTypeData = []
        for (let i = 0; i < 4; i++) {
          const workType = workTypes[i]
          if (workType) {
            workTypeData.push(
              escapeCsvField(workType.name || ''),
              escapeCsvField(workType.startTime || ''),
              escapeCsvField(workType.endTime || ''),
              escapeCsvField(workType.breakTime === 'custom' ? workType.customBreakTime || '' : workType.breakTime || '')
            )
          } else {
            workTypeData.push('', '', '', '') // 빈 데이터
          }
        }
        
        // 휴무유형 정의 데이터 (최대 2개)
        const offDutyTypes = survey.off_duty_types || []
        const offDutyData = []
        for (let i = 0; i < 2; i++) {
          const offDutyType = offDutyTypes[i]
          if (offDutyType) {
            offDutyData.push(escapeCsvField(offDutyType.name || ''))
          } else {
            offDutyData.push('') // 빈 데이터
          }
        }
        
        // 일별 근무 데이터 추가 (근무명칭만 표시, 시간정보 제외)
        const shiftData = survey.shift_data || {}
        
        console.log('  - shift_data 키 개수:', Object.keys(shiftData).length)
        console.log('  - work_types 개수:', workTypes.length)
        console.log('  - off_duty_types 개수:', offDutyTypes.length)
        
        const dailyShifts = allDates.map(date => {
          const shiftId = shiftData[date]
          if (!shiftId) return escapeCsvField('')
          
          // 근무유형에서 찾기
          const workType = workTypes?.find((wt: any) => wt.id === shiftId)
          if (workType) {
            return escapeCsvField(workType.name || '')
          }
          
          // 휴무유형에서 찾기
          const offDutyType = offDutyTypes?.find((odt: any) => odt.id === shiftId)
          if (offDutyType) {
            return escapeCsvField(offDutyType.name || '')
          }
          
          return escapeCsvField('')
        })
        
        return [...basicData, ...workTypeData, ...offDutyData, ...dailyShifts].join(',')
      }).join('\n')

      console.log('✅ CSV 데이터 생성 완료')

      // CSV 파일 다운로드
      const csvContent = `\uFEFF${headers}\n${csvData}` // BOM 추가 (Excel에서 한글 깨짐 방지)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `간호사_근무표_설문조사_상세_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('💾 엑셀 다운로드 완료!')
        alert(`✅ 상세 엑셀 파일 다운로드 완료!\n 총 ${data.length}개 응답 근무 데이터`)
      }
    } catch (err) {
      console.error('CSV 다운로드 실패:', err)
      alert('CSV 다운로드 중 오류가 발생했습니다.')
    }
  }

  // ⚠️ verifyDeletion 함수 제거 - setTimeout 기반 검증이 캐시 문제를 야기함
  // 새로운 접근: 삭제 후 즉시 실제 DB에서 재조회하는 방식으로 변경

  // 개별 체크박스 처리 (중복 로그 수정)
  const handleSelectSurvey = (surveyId: string, checked: boolean) => {
    setSelectedSurveyIds(prev => {
      let newSelected
      if (checked) {
        // 중복 방지
        if (prev.includes(surveyId)) {
          return prev // 이미 선택된 경우 변경 없음
        }
        newSelected = [...prev, surveyId]
      } else {
        newSelected = prev.filter(id => id !== surveyId)
      }
      
      console.log(`📋 체크박스 ${checked ? '선택' : '해제'}:`, surveyId)
      console.log('✅ 최종 선택된 ID들:', newSelected)
      return newSelected
    })
  }

  // 전체 선택/해제 (강화된 버전)
  const handleSelectAll = (checked: boolean) => {
    console.log(`🔄 전체 ${checked ? '선택' : '해제'}`)
    
    if (checked) {
      const allIds = surveys.map(survey => survey.id)
      console.log('🎯 전체 선택 ID들:', allIds)
      setSelectedSurveyIds(allIds)
    } else {
      console.log('❌ 전체 선택 해제')
      setSelectedSurveyIds([])
    }
  }

  // 선택된 설문 삭제 (완전 재설계 - 캐시 없는 직접 DB 조작)
  const handleDeleteSelected = async () => {
    if (selectedSurveyIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.')
      return
    }

    console.log('🗑️ 삭제 요청 ID들:', selectedSurveyIds)

    const confirmMessage = `선택된 ${selectedSurveyIds.length}개의 설문을 삭제하시겠습니까?\n\n⚠️ 연결된 개인정보도 함께 삭제됩니다.\n⚠️ 이 작업은 되돌릴 수 없습니다.`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setIsDeleting(true)
      console.log('🔥 완전 삭제 프로세스 시작 (캐시 없음)')

      // 🔐 인증된 사용자의 세션을 유지하면서 캐시만 제거
      console.log('🔐 authenticated 사용자로 삭제 작업 수행')
      console.log('👤 현재 사용자:', currentUser?.email)
      
      // ⚠️ 기존 인증된 세션 유지 - 새 클라이언트 생성하지 않음
      const deleteClient = supabase

      let successCount = 0
      let failedIds = []

      // 삭제 전 실제 존재 여부 확인
      console.log('🔍 삭제 전 실제 존재 여부 확인...')
      const { data: existingData, error: checkError } = await deleteClient
        .from('surveys')
        .select('id')
        .in('id', selectedSurveyIds)
      
      if (checkError) {
        console.error('❌ 존재 여부 확인 실패:', checkError)
        throw checkError
      }

      const existingIds = existingData?.map(item => item.id) || []
      console.log('📊 실제 존재하는 ID들:', existingIds.length, '개')

      // 실제 존재하는 ID들만 삭제
      for (const surveyId of existingIds) {
        console.log(`🎯 삭제 실행: ${surveyId.substring(0, 8)}...`)
        
        // 🧪 삭제 전 해당 ID 실제 존재 확인
        const { data: beforeDelete } = await deleteClient
          .from('surveys')
          .select('id')
          .eq('id', surveyId)
        
        console.log(`🔍 삭제 전 ID ${surveyId.substring(0, 8)} 존재 여부:`, beforeDelete?.length || 0, '개')

        // 🔍 핵심 체크: 사용자 인증 상태 확인
        const { data: { user }, error: authError } = await deleteClient.auth.getUser()
        console.log(`👤 현재 사용자 상태:`, user ? 'authenticated' : 'anon')
        console.log(`🔐 사용자 정보:`, user?.id || 'anonymous')
        
        if (authError) {
          console.error('🚨 인증 상태 확인 오류:', authError)
        }
        
        // RLS 정책 상태: DELETE는 authenticated만 허용됨
        if (!user) {
          console.warn('⚠️ ANON 사용자가 DELETE 시도 - RLS에서 차단될 수 있음')
        }

        // 🚨 실제 삭제 시도
        console.log(`🔥 삭제 시도: ${surveyId.substring(0, 8)}... (역할: ${user ? 'authenticated' : 'anon'})`)
        
        const { error, count } = await deleteClient
          .from('surveys')
          .delete()
          .eq('id', surveyId)
        
        console.log('🔍 삭제 쿼리 결과:')
        console.log('  - error:', error)
        console.log('  - count:', count)
        console.log('  - error.code:', error?.code)
        console.log('  - error.message:', error?.message)

        // 🧪 삭제 후 해당 ID 실제 삭제 확인
        const { data: afterDelete } = await deleteClient
          .from('surveys')
          .select('id')
          .eq('id', surveyId)

        console.log(`🔍 삭제 후 ID ${surveyId.substring(0, 8)} 존재 여부:`, afterDelete?.length || 0, '개')

        if (error) {
          console.error(`❌ 삭제 실패 (${surveyId.substring(0, 8)}):`, error)
          console.error(`❌ 에러 상세:`, error.message, error.code, error.details)
          failedIds.push(surveyId)
        } else {
          console.log(`✅ 삭제 성공 (${count}행 삭제됨)`)
          
          // 삭제 후에도 데이터가 남아있는지 확인
          if (afterDelete && afterDelete.length > 0) {
            console.error(`🚨 치명적 오류: 삭제했는데 데이터가 여전히 존재함!`)
            failedIds.push(surveyId)
          } else {
            console.log(`🎉 완전 삭제 확인됨: ${surveyId.substring(0, 8)}`)
            successCount++
          }
        }
      }

      console.log(`📊 삭제 완료: ${successCount}개 성공, ${failedIds.length}개 실패`)

      // ⚠️ 핵심: UI 상태 조작 없이 실제 DB에서 재조회
      console.log('🔄 삭제 후 실제 DB 상태 재조회...')
      await fetchSurveys() // 캐시 없는 실시간 DB 조회
      
      // 선택 초기화
      setSelectedSurveyIds([])

      // 결과 알림
      if (successCount > 0) {
        alert(`✅ ${successCount}개 설문 삭제 완료!${failedIds.length > 0 ? `\n⚠️ ${failedIds.length}개 실패` : ''}`)
      } else {
        alert('❌ 모든 삭제 작업이 실패했습니다.')
      }

    } catch (err) {
      console.error('💥 삭제 중 오류:', err)
      alert(`삭제 중 오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // 🔐 인증 상태 확인 (AuthSessionMissingError 핸들링)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔐 관리자 인증 상태 확인 중...')
        
        // 먼저 현재 세션 상태 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ 세션 확인 오류:', sessionError)
          console.warn('⚠️ 세션 없음 - 로그인 필요')
          setAuthLoading(false)
          router.push('/admin')
          return
        }

        if (!session) {
          console.warn('⚠️ 인증 세션 없음 - 로그인 페이지로 리다이렉트')
          setAuthLoading(false)
          router.push('/admin')
          return
        }

        // 세션이 있으면 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('❌ 사용자 정보 확인 실패:', userError)
          console.warn('⚠️ 유효하지 않은 사용자 - 로그인 필요')
          setAuthLoading(false)
          router.push('/admin')
          return
        }

        console.log('✅ 인증된 관리자:', user.email)
        console.log('🔐 사용자 ID:', user.id)
        console.log('👤 사용자 역할: authenticated')
        console.log('🕐 세션 만료 시간:', session.expires_at)
        
        setIsAuthenticated(true)
        setCurrentUser(user)
        setAuthLoading(false)
        
        // 인증된 경우에만 데이터 로드
        console.log('🚀 인증 완료 - 데이터 로드 시작')
        fetchSurveys()
        
      } catch (err) {
        console.error('💥 인증 확인 중 예외:', err)
        
        // AuthSessionMissingError 특별 처리
        if (err instanceof Error && err.message.includes('session')) {
          console.warn('⚠️ AuthSessionMissingError - 즉시 로그인 페이지로 이동')
          setAuthLoading(false)
          router.push('/admin')
          return
        }
        
        setError('인증 확인 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // 🔐 인증 확인 중일 때 로딩 화면
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">관리자 인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 🔐 인증되지 않은 경우 차단
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">관리자 로그인이 필요합니다.</p>
          <button 
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              ADMIN DASHBOARD
            </h1>
            <div className="flex space-x-4">
              {/* 선택된 항목 표시 (항상 표시) */}
              <div className="flex items-center px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                선택됨: <span className="font-bold ml-1">{selectedSurveyIds.length}</span>개
              </div>
              
              {/* 삭제 버튼 (선택된 항목이 있을 때만) */}
              {selectedSurveyIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center font-bold"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      삭제 진행 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                       삭제 ({selectedSurveyIds.length}개)
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                 상세 엑셀 다운로드
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🚪 관리자 로그아웃 시도...')
                    
                    const { error } = await supabase.auth.signOut()
                    
                    if (error) {
                      console.error('❌ 로그아웃 실패:', error)
                      alert('로그아웃 중 오류가 발생했습니다.')
                    } else {
                      console.log('✅ 로그아웃 성공')
                      alert('로그아웃되었습니다.')
                      router.push('/admin')
                    }
                  } catch (err) {
                    console.error('💥 로그아웃 중 예외:', err)
                    alert('로그아웃 중 오류가 발생했습니다.')
                  }
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                 로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-6 py-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button 
              onClick={fetchSurveys}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden">
            {/* 파랑색 책갈피 */}
            <div className="absolute top-0 left-0 w-12 h-12 md:w-14 md:h-14">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 transform rotate-45 -translate-x-6 -translate-y-6 md:-translate-x-7 md:-translate-y-7 shadow-lg"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              총 응답 수
            </h3>
            {loading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-blue-600">
                {surveys.length}
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden">
            {/* 파랑색 책갈피 */}
            <div className="absolute top-0 left-0 w-12 h-12 md:w-14 md:h-14">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 transform rotate-45 -translate-x-6 -translate-y-6 md:-translate-x-7 md:-translate-y-7 shadow-lg"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              개인정보 제공
            </h3>
            {loading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {surveys.filter(s => s.has_personal_info).length}
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden">
            {/* 파랑색 책갈피 */}
            <div className="absolute top-0 left-0 w-12 h-12 md:w-14 md:h-14">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 transform rotate-45 -translate-x-6 -translate-y-6 md:-translate-x-7 md:-translate-y-7 shadow-lg"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              최근 응답
            </h3>
            {loading ? (
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            ) : sortedSurveys.length > 0 ? (
              <div className="text-sm text-gray-600">
                <p>{new Date(sortedSurveys[0].created_at).toLocaleDateString('ko-KR')}</p>
                <p className="text-xs text-gray-500">{new Date(sortedSurveys[0].created_at).toLocaleTimeString('ko-KR')}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">응답 없음</p>
            )}
          </div>
        </div>

        {/* 응답 목록 테이블 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                설문 응답 목록
              </h2>
              {!loading && surveys.length > 0 && (
                <div className="text-sm bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-2">
                  <span className="text-blue-600">
                    정렬: {sortField === 'created_at' ? '응답일시' : 
                          sortField === 'hire_date' ? '입사연월' :
                          sortField === 'age' ? '연령' :
                          sortField === 'medical_institution_type' ? '의료기관' :
                          sortField === 'department' ? '부서' :
                          sortField === 'medical_institution_location' ? '지역' : sortField}
                  </span>
                  <SortIcon field={sortField} />
                </div>
              )}
            </div>
            {!loading && surveys.length > 0 && (
              <button 
                onClick={fetchSurveys}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                 실시간 새로고침
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : surveys.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <p>아직 설문 응답이 없습니다.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      <div className="flex items-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={surveys.length > 0 && selectedSurveyIds.length === surveys.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="mr-1 h-4 w-4 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        선택
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('hire_date')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'hire_date' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>입사연월</span>
                        <SortIcon field="hire_date" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('age')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'age' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>성별/연령</span>
                        <SortIcon field="age" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('medical_institution_type')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'medical_institution_type' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>의료기관</span>
                        <SortIcon field="medical_institution_type" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('department')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'department' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>부서</span>
                        <SortIcon field="department" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('medical_institution_location')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'medical_institution_location' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>지역</span>
                        <SortIcon field="medical_institution_location" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      개인정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('created_at')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'created_at' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>응답일시</span>
                        <SortIcon field="created_at" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSurveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 w-20">
                        <input
                          type="checkbox"
                          checked={selectedSurveyIds.includes(survey.id)}
                          onChange={(e) => handleSelectSurvey(survey.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {survey.hire_year}년 {survey.hire_month}월
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getGenderLabel(survey.gender)} / {survey.age}세
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getInstitutionTypeLabel(survey.medical_institution_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDepartmentLabel(survey.department)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getLocationLabel(survey.medical_institution_location)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          survey.has_personal_info 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {survey.has_personal_info ? '제공' : '미제공'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(survey.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          {/* 근무표 보기 버튼 */}
                          <button 
                            onClick={() => fetchSurveyDetail(survey.id)}
                            disabled={scheduleLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center"
                            title="근무표 보기"
                          >
                            {scheduleLoading ? (
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                근무표
                              </>
                            )}
                          </button>
                          

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* 근무표 보기 모달 */}
      {showScheduleModal && selectedSurvey && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                응답자 근무표 상세보기
              </h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false)
                  setSelectedSurvey(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="mt-4 max-h-[80vh] overflow-y-auto">
              <WorkScheduleViewer
                workTypes={selectedSurvey.work_types || []}
                offDutyTypes={selectedSurvey.off_duty_types || []}
                shiftData={selectedSurvey.shift_data || {}}
                surveyInfo={{
                  id: selectedSurvey.id,
                  gender: getGenderLabel(selectedSurvey.gender),
                  age: selectedSurvey.age,
                  department: getDepartmentLabel(selectedSurvey.department),
                  institutionType: getInstitutionTypeLabel(selectedSurvey.medical_institution_type),
                  location: getLocationLabel(selectedSurvey.medical_institution_location)
                }}
                personalInfo={selectedSurvey.personal_info_data}
              />
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false)
                  setSelectedSurvey(null)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
