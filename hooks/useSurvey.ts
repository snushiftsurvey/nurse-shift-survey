import { useSurvey as useContextSurvey } from '@/contexts/SurveyContext'
import { supabasePublic } from '@/lib/supabase'
import { SurveyData, PersonalInfo } from '@/lib/types'
import { useCallback } from 'react'

export function useSurvey() {
  const { state, dispatch } = useContextSurvey()

  const updateSurveyData = useCallback((data: Partial<SurveyData>) => {
    dispatch({ type: 'UPDATE_SURVEY_DATA', payload: data })
  }, [dispatch])

  const updatePersonalInfo = useCallback((info: Partial<PersonalInfo>) => {
    dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: info })
  }, [dispatch])

  const setCurrentStep = useCallback((step: string) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [dispatch])

  const startSurvey = useCallback(() => {
    dispatch({ type: 'START_SURVEY' })
  }, [dispatch])

  const forceClearAll = useCallback(() => {
    console.log('🔒 강제 전체 초기화 실행')
    dispatch({ type: 'FORCE_CLEAR_ALL' })
  }, [dispatch])

  const submitSurvey = useCallback(async (overrides?: {
    consentPersonalInfo?: boolean
    personalInfo?: Partial<PersonalInfo>
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // overrides가 있으면 우선 사용, 없으면 state에서 가져오기
      const finalConsentPersonalInfo = overrides?.consentPersonalInfo ?? state.surveyData.consentPersonalInfo
      const finalPersonalInfo = overrides?.personalInfo ?? state.personalInfo

      console.log('🔍 제출 데이터 준비:')
      console.log('  - finalConsentPersonalInfo:', finalConsentPersonalInfo)
      console.log('  - finalPersonalInfo:', finalPersonalInfo)
      console.log('  - surveyData:', state.surveyData)

      // 설문 데이터 저장
      const surveyInsertData = {
        gender: state.surveyData.gender,
        age: state.surveyData.age,
        hire_year: state.surveyData.hireYear,
        hire_month: state.surveyData.hireMonth,
        medical_institution_type: state.surveyData.medicalInstitutionType || '기타',
        medical_institution_location: state.surveyData.medicalInstitutionLocation || '기타',
        department: state.surveyData.department || '기타',
        shift_data: state.surveyData.shiftData || {},
        work_types: state.surveyData.workTypes || [],
        off_duty_types: state.surveyData.offDutyTypes || [],
        consent_personal_info: finalConsentPersonalInfo || false,
      }

      console.log('📤 surveys 테이블에 저장할 데이터:', surveyInsertData)

      const { data: surveyResponse, error: surveyError } = await supabasePublic
        .from('surveys')
        .insert([surveyInsertData])
        .select()
        .single()

      if (surveyError) {
        console.error('❌ surveys 테이블 저장 실패:', surveyError)
        throw surveyError
      }

      console.log('✅ surveys 테이블 저장 성공:', surveyResponse)

      if (finalConsentPersonalInfo && finalPersonalInfo.name) {
        console.log('✅ 개인정보 저장 조건 충족 - DB 저장 시작')
        
        const personalInfoData = {
          survey_id: surveyResponse.id,
          name: finalPersonalInfo.name,
          birth_date: finalPersonalInfo.birthDate,
          phone_number: finalPersonalInfo.phoneNumber,
        }
        
        console.log('📤 저장할 개인정보 데이터:', personalInfoData)
        
        const { data: personalResult, error: personalError } = await supabasePublic
          .from('personal_info')
          .insert([personalInfoData])
          .select()

        if (personalError) {
          console.error('❌ 개인정보 저장 실패:', personalError)
          throw personalError
        } else {
          console.log('✅ 개인정보 저장 성공:', personalResult)
        }
      } else {
        console.warn('⚠️ 개인정보 저장 조건 불충족')
        if (!finalConsentPersonalInfo) {
          console.warn('  - 개인정보 동의 안함')
        }
        if (!finalPersonalInfo.name) {
          console.warn('  - 이름 없음')
        }
      }

      return surveyResponse.id

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, state])

  return {
    state,
    updateSurveyData,
    updatePersonalInfo,
    setCurrentStep,
    startSurvey,
    submitSurvey,
    forceClearAll,
  }
}
