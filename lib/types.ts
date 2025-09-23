// 설문조사 관련 타입 정의

export interface WorkType {
  id: string
  name: string
  startTime: string
  endTime: string
  breakTime: 'none' | '30min' | '60min' | 'unknown' | 'custom'
  customBreakTime?: string // 직접 입력한 휴게시간
}

export interface OffDutyType {
  id: string
  name: string
  description?: string // 휴무 설명 (선택사항)
  isDefault?: boolean // 기본 휴무 여부
}

export interface ShiftData {
  [date: string]: string // 날짜별 근무유형 ID
}

export interface SurveyData {
  // 일반적 특성
  gender: 'female' | 'male'
  age: number
  hireYear: number
  hireMonth: number
  
  // 연구대상 확인
  medicalInstitutionType: 'tertiary' | 'general' | 'hospital' | 'other'
  medicalInstitutionLocation: string
  department: string
  
  // 근무표 관련
  workTypes: WorkType[]
  offDutyTypes: OffDutyType[]
  shiftData: ShiftData
  
  // 동의 여부
  consentPersonalInfo: boolean
  
  // 전자서명 관련
  consentName?: string
  consentSignature?: string
  consentDate?: string
}

export interface PersonalInfo {
  name: string
  birthDate: string
  phoneNumber: string
}

export interface SurveyResponse {
  id: string
  surveyData: SurveyData
  personalInfo?: PersonalInfo
  createdAt: string
}
