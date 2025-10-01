'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, safeQuery } from '@/lib/supabase'
import WorkScheduleViewer from '@/components/admin/WorkScheduleViewer'
import SurveyLimitsModal from '@/components/admin/SurveyLimitsModal'
import ConsentDownloader from '@/components/admin/ConsentDownloader'
import BatchPDFDownloader from '@/components/admin/BatchPDFDownloader'

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
  consent_pdf?: {
    id: string
    survey_id: string
    participant_name_signature?: string
    consent_date: string
    researcher_name: string
    researcher_signature: string
    researcher_date: string
    consent_form_pdf: string
    consent_signature1?: string
    consent_signature2?: string
    created_at: string
  }[]
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
  
  // 응답자 수 제한 모달 상태
  const [showLimitsModal, setShowLimitsModal] = useState(false)
  

  
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

  // 부서별 통계 상태
  const [departmentStats, setDepartmentStats] = useState<{[key: string]: {current: number, limit: number}}>({})
  const [limitsData, setLimitsData] = useState<any[]>([])  
  
  // 정렬 상태 관리
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // 페이지네이션 상태 관리
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50
  
  // 데이터 로딩 상태 관리
  const [hasMoreData, setHasMoreData] = useState(true)
  const [totalSurveyCount, setTotalSurveyCount] = useState(0)
  
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
      case 'integrated-care-ward': return '간호·간병통합서비스 병동'
      case 'emergency': return '응급실'
      case 'operating-room': return '수술실'
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

  // 페이지네이션 계산
  const totalPages = Math.ceil(sortedSurveys.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageData = sortedSurveys.slice(startIndex, endIndex)

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 페이지 변경 시 선택된 항목 초기화
    setSelectedSurveyIds([])
  }

  // 정렬 아이콘 컴포넌트
  const SortIcon = ({ field }: { field: string }) => {
    const isActive = sortField === field
    
    return (
      <svg className={`w-4 h-4 ${isActive ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    )
  }

  // 특정 설문의 상세 정보 조회 (근무표 포함) - AutoWake 적용
  const fetchSurveyDetail = async (surveyId: string) => {
    try {
      setScheduleLoading(true)

      const data = await safeQuery.admin(async () => {
        const { data, error } = await supabase
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
          .eq('is_draft', false) // draft 데이터 제외
          .single()

        if (error) {
          console.error('🔄 설문 상세 정보 조회 실패:', error)
          throw error
        }

        return data
      })

      const detailedSurvey: DetailedSurveyData = {
        ...data,
        has_personal_info: data.personal_info && data.personal_info.length > 0,
        personal_info_data: data.personal_info && data.personal_info.length > 0 ? data.personal_info[0] : null
      }

      setSelectedSurvey(detailedSurvey)
      setShowScheduleModal(true)
      console.log('✅ 설문 상세 정보 조회 성공 (AutoWake 적용):', surveyId)
    } catch (err) {
      console.error('❌ 설문 상세 정보 조회 실패:', err)
      alert('설문 상세 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setScheduleLoading(false)
    }
  }



  // 부서별 통계 및 제한 조회 - AutoWake 적용
  const fetchDepartmentStats = async () => {
    try {
      console.log('📊 부서별 통계 조회 시작 (AutoWake 적용)...')

      // 1. 제한 설정 조회 - AutoWake 적용
      const limits = await safeQuery.admin(async () => {
        const { data, error } = await supabase
          .from('survey_limits')
          .select('*')
        
        if (error) {
          console.error('🔄 응답자 수 제한 설정 조회 실패:', error)
          throw error
        }

        return data
      })

      console.log('✅ 제한 설정 조회 성공 (AutoWake 적용):', limits?.length, '개')
      setLimitsData(limits || [])

      // 2. 부서별 현재 응답 수 조회
      const departments = [
        { key: 'general-ward', name: '일반병동' },
        { key: 'integrated-care-ward', name: '간호·간병통합서비스 병동' },
        { key: 'icu', name: '중환자실' }
      ]

      const stats: {[key: string]: {current: number, limit: number}} = {}

      for (const dept of departments) {
        console.log(`🔍 ${dept.name} 응답 수 조회...`)
        
        // 현재 응답 수 조회 - AutoWake 적용
        const countResult = await safeQuery.admin(async () => {
          const { count, error } = await supabase
            .from('surveys')
            .select('*', { count: 'exact', head: true })
            .eq('department', dept.key)
            .eq('is_draft', false) // draft 데이터 제외
          
          if (error) {
            console.error(`🔄 ${dept.key} 응답 수 조회 실패:`, error)
            throw error
          }

          return { count }
        })

        const currentCount = countResult?.count || 0

        // 제한 값 찾기  
        const limitSetting = limits?.find((l: any) => l.setting_name === `${dept.key.replace('-', '_')}_limit`)
        const limit = limitSetting?.setting_value || 0

        stats[dept.key] = {
          current: currentCount,
          limit: limit
        }

        console.log(`✅ ${dept.name}: ${currentCount}/${limit} (AutoWake 적용)`)
      }

      setDepartmentStats(stats)
      console.log('📊 부서별 통계 업데이트 완료')
    } catch (err) {
      console.error('💥 부서별 통계 조회 중 오류:', err)
    }
  }

  // 설문 데이터 조회 (authenticated 사용자 전용)
  const fetchSurveys = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📊 설문 데이터 조회 시작...')

      // 🔐 먼저 현재 인증 상태 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 현재 인증 상태:', user ? 'authenticated' : 'anon', user ? `(${user.id})` : '')
      
      if (authError) {
        console.error('❌ 인증 확인 오류:', authError)
        throw new Error(`인증 확인 실패: ${authError.message}`)
      }

      if (!user) {
        console.warn('⚠️ 인증되지 않은 상태에서 데이터 조회 시도')
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
      }

      console.log('🔍 최적화된 설문 데이터 쿼리 실행 (AutoWake 적용, 전체 데이터, PDF 제외)...')
      
      // 전체 설문 데이터 조회 (PDF 바이너리 데이터만 제외하여 빠른 로딩) - AutoWake 적용
      const data = await safeQuery.admin(async () => {
        const { data, error } = await supabase
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
            personal_info(id),
            consent_pdfs(
              id,
              survey_id, 
              consent_date,
              researcher_name,
              created_at
            )
          `)
          .eq('is_draft', false) // draft 데이터 제외
          .order('created_at', { ascending: false })

        if (error) {
          console.error('🔄 설문 데이터 쿼리 실패:', error)
          
          // 타임아웃 에러인 경우 특별 처리
          if (error.code === '57014') {
            throw new Error('데이터가 너무 많아 조회 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.')
          }
          
          throw new Error(`데이터 조회 실패: ${error.message} (${error.code})`)
        }

        return data
      })

      console.log(`✅ 전체 설문 데이터 조회 성공 (AutoWake 적용):`, data?.length, '개')

      if (!data) {
        console.log('📄 설문 데이터가 존재하지 않습니다')
        setSurveys([])
        setError(null)
        setTotalSurveyCount(0)
        setHasMoreData(false)
        return
      }

      // personal_info와 consent_pdf 관계를 기반으로 설정
      const surveysWithPersonalInfo = data?.map((survey: any) => ({
        ...survey,
        has_personal_info: survey.personal_info && survey.personal_info.length > 0,
        consent_pdf: survey.consent_pdfs || []
      })) || []

      setSurveys(surveysWithPersonalInfo)
      setTotalSurveyCount(data.length) // 실제 로드된 데이터 수
      setHasMoreData(false) // 전체 데이터 로드 완료
      console.log('📊 전체 데이터 UI 상태 업데이트 완료')

      // 부서별 통계도 함께 조회
      await fetchDepartmentStats()
      
    } catch (err) {
      console.error('💥 설문 데이터 조회 중 오류:', err)
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(`설문 데이터 조회 실패: ${errorMessage}`)
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
        .eq('is_draft', false) // draft 데이터 제외
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
      
      // 근무유형 정의 헤더 (동적 생성)
      const maxWorkTypes = Math.max(...data.map((survey: any) => (survey.work_types || []).length), 1) // 최소 1개
      const workTypeHeaders = []
      for (let i = 1; i <= maxWorkTypes; i++) {
        workTypeHeaders.push(`근무${i}`, `근무${i}시작`, `근무${i}종료`, `근무${i}휴게`)
      }
      
      // 휴무유형 정의 헤더 (동적 생성)
      const maxOffDutyTypes = Math.max(...data.map((survey: any) => (survey.off_duty_types || []).length), 5) // 최소 5개 (기본 휴무)
      const offDutyHeaders = []
      for (let i = 1; i <= maxOffDutyTypes; i++) {
        offDutyHeaders.push(`휴무${i}`)
      }
      
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
      const csvData = data.map((survey: any) => {
        console.log('🔍 처리 중인 설문 ID:', survey.id.substring(0, 8))
        
        // 기본 정보 (클라이언트 요청 순서대로 재배열)
        const basicData = [
          `="${survey.id}"`,  // ID에 작은따옴표 추가
          escapeCsvField(getInstitutionTypeLabel(survey.medical_institution_type)),
          escapeCsvField(getLocationLabel(survey.medical_institution_location)),
          escapeCsvField(getDepartmentLabel(survey.department)),
          escapeCsvField(getGenderLabel(survey.gender)),
          escapeCsvField(survey.age),
          escapeCsvField(survey.hire_year),
          escapeCsvField(survey.hire_month),
          escapeCsvField(survey.personal_info?.[0]?.name || ''),
          `="${survey.personal_info?.[0]?.birth_date || ''}"`,  // 생년월일에 작은따옴표 추가
          `="${survey.personal_info?.[0]?.phone_number || ''}"`  // 휴대폰번호 (기존)
        ]
        
        // 근무유형 정의 데이터 (동적 개수)
        const workTypes = (survey as any).work_types || []
        const workTypeData = []
        for (let i = 0; i < maxWorkTypes; i++) {
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
        
        // 휴무유형 정의 데이터 (동적 개수)
        const offDutyTypes = survey.off_duty_types || []
        const offDutyData = []
        for (let i = 0; i < maxOffDutyTypes; i++) {
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

      return newSelected
    })
  }

  // 전체 선택/해제 (강화된 버전)
  const handleSelectAll = (checked: boolean) => {

    
    if (checked) {
      const allIds = surveys.map(survey => survey.id)

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



    const confirmMessage = `선택된 ${selectedSurveyIds.length}개의 설문을 삭제하시겠습니까?\n\n⚠️ 연결된 개인정보도 함께 삭제됩니다.\n⚠️ 연결된 동의서 PDF도 함께 삭제됩니다.\n⚠️ 이 작업은 되돌릴 수 없습니다.`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setIsDeleting(true)

      
      // ⚠️ 기존 인증된 세션 유지 - 새 클라이언트 생성하지 않음
      const deleteClient = supabase

      let successCount = 0
      let failedIds = []

      // 삭제 전 실제 존재 여부 확인 - AutoWake 적용
      const existingData = await safeQuery.admin(async () => {
        const { data, error } = await deleteClient
          .from('surveys')
          .select('id')
          .in('id', selectedSurveyIds)
          .eq('is_draft', false) // draft 데이터는 삭제 대상에서 제외
        
        if (error) {
          console.error('🔄 존재 여부 확인 실패:', error)
          throw error
        }

        return data
      })

      const existingIds = existingData?.map((item: any) => item.id) || []
      console.log('📊 실제 존재하는 ID들:', existingIds.length, '개')

      // 🔍 사용자 인증 상태 확인 (한 번만)
      const { data: { user }, error: authError } = await deleteClient.auth.getUser()
      console.log(`👤 현재 사용자 상태:`, user ? 'authenticated' : 'anon')
      
      if (authError) {
        console.error('🚨 인증 상태 확인 오류:', authError)
        throw new Error('인증 상태 확인 실패')
      }
      
      if (!user) {
        console.warn('⚠️ ANON 사용자가 DELETE 시도 - RLS에서 차단될 수 있음')
        throw new Error('인증되지 않은 사용자')
      }

      // 🗂️ 1단계: 연관된 consent_pdfs 데이터 일괄 삭제 (성능 최적화) - AutoWake 적용
      console.log(`📄 연관 PDF 데이터 일괄 삭제 (AutoWake 적용): ${existingIds.length}개`)
      
      const pdfDeleteResult = await safeQuery.admin(async () => {
        const { error, count } = await deleteClient
          .from('consent_pdfs')
          .delete()
          .in('survey_id', existingIds)
        
        if (error) {
          console.warn(`🔄 PDF 일괄 삭제 실패:`, error.message)
          // PDF 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
          return { success: false, count: 0, error: error.message }
        }

        return { success: true, count: count || 0, error: null }
      })
      
      if (pdfDeleteResult.success) {
        console.log(`✅ PDF 데이터 일괄 삭제 완료 (AutoWake 적용): ${pdfDeleteResult.count}개`)
      } else {
        console.warn(`⚠️ PDF 일괄 삭제 실패 (AutoWake 적용):`, pdfDeleteResult.error)
      }

      // 🚨 2단계: 설문 데이터 일괄 삭제 (성능 최적화) - AutoWake 적용
      console.log(`🔥 설문 일괄 삭제 시도 (AutoWake 적용): ${existingIds.length}개`)
      
      const surveyDeleteResult = await safeQuery.admin(async () => {
        const { error } = await deleteClient
          .from('surveys')
          .delete()
          .in('id', existingIds)
          .eq('is_draft', false) // draft 데이터는 삭제하지 않음
        
        if (error) {
          console.error(`🔄 설문 일괄 삭제 실패:`, error)
          throw error
        }

        return { success: true }
      })
      
      console.log('🔍 설문 일괄 삭제 결과 (AutoWake 적용):')
      console.log('  - success:', surveyDeleteResult.success)

      if (surveyDeleteResult.success) {
        // Supabase delete는 count를 반환하지 않으므로, 요청한 갯수 기준으로 성공 처리
        successCount = existingIds.length
        console.log(`✅ 설문 일괄 삭제 성공 (AutoWake 적용): ${successCount}개`)
      } else {
        failedIds = existingIds
      }

      console.log(`📊 삭제 완료: ${successCount}개 성공, ${failedIds.length}개 실패`)

      // ⚠️ 핵심: UI 상태 조작 없이 실제 DB에서 재조회
      console.log('🔄 삭제 후 실제 DB 상태 재조회...')
      await fetchSurveys() // 캐시 없는 실시간 DB 조회
      
      // 선택 초기화
      setSelectedSurveyIds([])

      // 결과 알림
      if (successCount > 0 && failedIds.length === 0) {
        alert(`✅ ${successCount}개 설문 삭제 완료!${failedIds.length > 0 ? `\n⚠️ ${failedIds.length}개 실패` : ''}`)
      } else if (successCount > 0 && failedIds.length > 0) {
        alert(`⚠️ 일부만 삭제됨: 성공 ${successCount}개 / 실패 ${failedIds.length}개`)
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

        
        // 먼저 현재 세션 상태 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error(' 세션 확인 오류:', sessionError)
          console.warn(' 세션 없음 - 로그인 필요')
          setAuthLoading(false)
          router.push('/admin')
          return
        }

        if (!session) {
          console.warn(' 인증 세션 없음 - 로그인 페이지로 리다이렉트')
          setAuthLoading(false)
          router.push('/admin')
          return
        }

        // 세션이 있으면 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error(' 사용자 정보 확인 실패:', userError)
          console.warn(' 유효하지 않은 사용자 - 로그인 필요')
          setAuthLoading(false)
          router.push('/admin')
          return
        }

        setIsAuthenticated(true)
        setCurrentUser(user)
        setAuthLoading(false)
        
        // 인증된 경우에만 데이터 로드

        fetchSurveys()
        
      } catch (err) {
        console.error(' 인증 확인 중 예외:', err)
        
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
            <div className="flex space-x-3">
          
              {/* 응답자 수 제한 설정 버튼 */}
              <button
                onClick={() => setShowLimitsModal(true)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                응답자 수 설정
              </button>
              
              <button
                onClick={async () => {
                  try {
                    console.log('🚪 Admin 로그아웃 시도... (설문 웹과 독립적)')
                    
                    // Admin 세션만 정리 (설문 웹에 영향 없음)
                    const { error } = await supabase.auth.signOut()
                    
                    if (error) {
                      console.error('❌ Admin 로그아웃 실패:', error)
                    }
                    
                    console.log('✅ Admin 로그아웃 완료 (설문 웹 데이터 보존)')
                    
                    // Admin 상태만 초기화
                    setIsAuthenticated(false)
                    setCurrentUser(null)
                    setSurveys([])
                    
                    // 로그인 페이지로 이동
                    router.push('/admin')
                    
                  } catch (err) {
                    console.error('💥 Admin 로그아웃 중 예외:', err)
                    
                    // 예외 발생해도 강제로 로그인 페이지로 이동
                    router.push('/admin')
                  }
                }}
                className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-gray-700 transition-colors"
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {/* 총 응답 수 */}
          <div className="bg-white rounded-lg shadow p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 transform rotate-45 -translate-x-5 -translate-y-5 md:-translate-x-6 md:-translate-y-6 shadow-lg"></div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              총 응답 수
            </h3>
            {loading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {surveys.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  / {limitsData.find(l => l.setting_name === 'total_limit')?.setting_value || 350}
                </p>
              </div>
            )}
          </div>
          
          {/* 개인정보 제공 */}
          <div className="bg-white rounded-lg shadow p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-600 to-green-700 transform rotate-45 -translate-x-5 -translate-y-5 md:-translate-x-6 md:-translate-y-6 shadow-lg"></div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              개인정보 제공
            </h3>
            {loading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {surveys.filter(s => s.has_personal_info).length}
              </p>
            )}
          </div>
          
          {/* 일반병동 */}
          <div className="bg-white rounded-lg shadow p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-600 to-orange-700 transform rotate-45 -translate-x-5 -translate-y-5 md:-translate-x-6 md:-translate-y-6 shadow-lg"></div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              일반병동
            </h3>
            {loading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {departmentStats['general-ward']?.current || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  / {departmentStats['general-ward']?.limit || 200}
                </p>
              </div>
            )}
          </div>
          
          {/* 간호·간병통합서비스 병동 */}
          <div className="bg-white rounded-lg shadow p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-600 to-orange-700 transform rotate-45 -translate-x-5 -translate-y-5 md:-translate-x-6 md:-translate-y-6 shadow-lg"></div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
            간호·간병통합서비스 병동
            </h3>
            {loading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {departmentStats['integrated-care-ward']?.current || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  / {departmentStats['integrated-care-ward']?.limit || 100}
                </p>
              </div>
            )}
          </div>
          
          {/* 중환자실 */}
          <div className="bg-white rounded-lg shadow p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-600 to-orange-700 transform rotate-45 -translate-x-5 -translate-y-5 md:-translate-x-6 md:-translate-y-6 shadow-lg"></div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              중환자실
            </h3>
            {loading ? (
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {departmentStats['icu']?.current || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  / {departmentStats['icu']?.limit || 100}
                </p>
              </div>
            )}
          </div>
          
          {/* 최근 응답 */}
          <div className="bg-white rounded-lg shadow p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 transform rotate-45 -translate-x-5 -translate-y-5 md:-translate-x-6 md:-translate-y-6 shadow-lg"></div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              최근 응답
            </h3>
            {loading ? (
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            ) : currentPageData.length > 0 ? (
              <div className="text-sm text-gray-600">
                <p className="text-xs">{new Date(sortedSurveys[0].created_at).toLocaleDateString('ko-KR')}</p>
                <p className="text-xs text-gray-500">{new Date(sortedSurveys[0].created_at).toLocaleTimeString('ko-KR')}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">응답 없음</p>
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
            <div className="flex items-center space-x-3">
              {/* 전체 데이터 수 표시 */}
              <div className="flex items-center px-3 py-1.5 bg-green-50 rounded-md text-sm text-green-700">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                전체 <span className="font-bold">{totalSurveyCount}</span>개 로드 완료
              </div>
              
              {/* 선택된 항목 표시 */}
              <div className="flex items-center px-3 py-1.5 bg-blue-50 rounded-md text-sm text-blue-700">
                선택됨: <span className="font-bold ml-1">{selectedSurveyIds.length}</span>개
              </div>
              
              {/* 삭제 버튼 (선택된 항목이 있을 때만) */}
              {selectedSurveyIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors disabled:bg-red-400 flex items-center font-medium"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      삭제 진행 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      삭제 ({selectedSurveyIds.length}개)
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleExportCSV}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                엑셀 다운로드
              </button>
              
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
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={surveys.length > 0 && selectedSurveyIds.length === surveys.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-3 w-3 text-blue-600 border border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                      />
                    </th>
                    <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('hire_date')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'hire_date' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>입사년월</span>
                        <SortIcon field="hire_date" />
                      </button>
                    </th>
                    <th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
                    <th className="w-32 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <button 
                        onClick={() => handleSort('medical_institution_type')}
                        className={`flex items-center space-x-1 hover:text-gray-700 transition-colors ${
                          sortField === 'medical_institution_type' ? 'text-blue-600' : ''
                        }`}
                      >
                        <span>기관</span>
                        <SortIcon field="medical_institution_type" />
                      </button>
                    </th>
                    <th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
                    <th className="w-16 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
                    <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      개인정보
                    </th>
                    <th className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      동의서(pdf)다운
                    </th>
                    <th className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
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
                    <th className="w-16 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      근무표 상세
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPageData.map((survey) => (
                    <tr key={survey.id} className="hover:bg-gray-50">
                      <td className="w-12 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        <input
                          type="checkbox"
                          checked={selectedSurveyIds.includes(survey.id)}
                          onChange={(e) => handleSelectSurvey(survey.id, e.target.checked)}
                          className="h-3 w-3 text-blue-600 border border-gray-300 rounded focus:ring-blue-500 focus:ring-1 cursor-pointer"
                        />
                      </td>
                      <td className="w-20 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        {survey.hire_year}.{String(survey.hire_month).padStart(2, '0')}
                      </td>
                      <td className="w-24 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getGenderLabel(survey.gender)} / {survey.age}세
                      </td>
                      <td className="w-32 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getInstitutionTypeLabel(survey.medical_institution_type)}
                      </td>
                      <td className="w-24 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getDepartmentLabel(survey.department)}
                      </td>
                      <td className="w-16 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        {getLocationLabel(survey.medical_institution_location)}
                      </td>
                      <td className="w-20 px-2 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                          survey.has_personal_info
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {survey.has_personal_info ? '제공' : '미제공'}
                        </span>
                      </td>
                      <td className="w-20 px-2 py-2 whitespace-nowrap">
                        {survey.consent_pdf && survey.consent_pdf.length > 0 ? (
                          <ConsentDownloader 
                            consentRecord={{
                              id: survey.consent_pdf[0].id,
                              survey_id: survey.consent_pdf[0].survey_id,
                              consent_date: survey.consent_pdf[0].consent_date || '2025.01.01',
                              researcher_name: survey.consent_pdf[0].researcher_name || '',
                              researcher_signature: '',
                              researcher_date: '',
                              created_at: survey.consent_pdf[0].created_at || ''
                            } as any} 
                          />
                        ) : (
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            없음
                          </span>
                        )}
                      </td>
                      <td className="w-24 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        {new Date(survey.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="w-16 px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                        <div className="flex space-x-1">
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
              </div>
            )}
            
            {/* 페이지네이션 */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between flex-1 sm:hidden">
                    {/* 모바일 페이지네이션 */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                  
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        총 <span className="font-medium">{sortedSurveys.length}</span>개 중{' '}
                        <span className="font-medium">{startIndex + 1}</span>-
                        <span className="font-medium">{Math.min(endIndex, sortedSurveys.length)}</span>개 표시
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        {/* 이전 버튼 */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">이전</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* 페이지 번호들 */}
                        {(() => {
                          const pages = []
                          const maxVisiblePages = 7
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                          
                          if (endPage - startPage + 1 < maxVisiblePages) {
                            startPage = Math.max(1, endPage - maxVisiblePages + 1)
                          }
                          
                          // 첫 페이지
                          if (startPage > 1) {
                            pages.push(
                              <button
                                key={1}
                                onClick={() => handlePageChange(1)}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                              >
                                1
                              </button>
                            )
                            if (startPage > 2) {
                              pages.push(
                                <span key="start-ellipsis" className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                                  ...
                                </span>
                              )
                            }
                          }
                          
                          // 중간 페이지들
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                                  i === currentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {i}
                              </button>
                            )
                          }
                          
                          // 마지막 페이지
                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              pages.push(
                                <span key="end-ellipsis" className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                                  ...
                                </span>
                              )
                            }
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => handlePageChange(totalPages)}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                              >
                                {totalPages}
                              </button>
                            )
                          }
                          
                          return pages
                        })()}
                        
                        {/* 다음 버튼 */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">다음</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* PDF 분할 다운로드 섹션 */}
        <div className="mt-8 mb-6">
          <BatchPDFDownloader surveys={surveys} />
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

      {/* 응답자 수 제한 설정 모달 */}
      <SurveyLimitsModal
        isOpen={showLimitsModal}
        onClose={() => setShowLimitsModal(false)}
        onUpdate={() => {
          // 설정 변경 후 데이터 새로고침
          fetchSurveys()
        }}
      />


    </div>
  )
}
