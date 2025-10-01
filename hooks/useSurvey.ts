import { useSurvey as useContextSurvey } from '@/contexts/SurveyContext'
import { supabasePublic, safeQuery } from '@/lib/supabase'
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
    console.log('강제 전체 초기화 실행')
    dispatch({ type: 'FORCE_CLEAR_ALL' })
  }, [dispatch])

  const submitSurvey = useCallback(async (overrides?: {
    consentPersonalInfo?: boolean
    personalInfo?: Partial<PersonalInfo>
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // 최종 제출 전 부서별 응답자 수 제한 재확인
      if (state.surveyData.department) {
        await checkDepartmentLimitsInSubmit(state.surveyData.department)
      }

      // overrides가 있으면 우선 사용, 없으면 state에서 가져오기
      const finalConsentPersonalInfo = overrides?.consentPersonalInfo ?? state.surveyData.consentPersonalInfo
      const finalPersonalInfo = overrides?.personalInfo ?? state.personalInfo

      console.log('🔍 제출 데이터 준비:')
      console.log('  - finalConsentPersonalInfo:', finalConsentPersonalInfo)
      console.log('  - finalPersonalInfo:', finalPersonalInfo)
      console.log('  - surveyData:', state.surveyData)

      // 최종 제출 시 부서별 제한 확인
      if (state.surveyData.department) {
        await checkDepartmentLimitsInSubmit(state.surveyData.department)
      }

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


      const surveyResponse = await safeQuery.public(async () => {
        const { data, error } = await supabasePublic
          .from('surveys')
          .insert([surveyInsertData])
          .select()
          .single()
        
        if (error) {
          console.error('🔄 surveys 테이블 저장 실패:', error)
          throw error
        }
        
        return data
      })

      console.log('✅ surveys 테이블 저장 성공 (AutoWake 적용):', surveyResponse.id)

      if (finalConsentPersonalInfo && finalPersonalInfo.name) {
        console.log(' 개인정보 저장 조건 충족 - DB 저장 시작')
        
        const personalInfoData = {
          survey_id: surveyResponse.id,
          name: finalPersonalInfo.name,
          birth_date: finalPersonalInfo.birthDate,
          phone_number: finalPersonalInfo.phoneNumber,
        }
        

        
        const personalResult = await safeQuery.public(async () => {
          const { data, error } = await supabasePublic
            .from('personal_info')
            .insert([personalInfoData])
            .select()

          if (error) {
            console.error('🔄 개인정보 저장 실패:', error)
            throw error
          }
          
          return data
        })
        
        console.log('✅ 개인정보 저장 성공 (AutoWake 적용):', personalResult)
      } else {

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

  // 최종 제출 시 부서별 제한 재확인
  const checkDepartmentLimitsInSubmit = async (selectedDepartment: string) => {
    try {
      const departmentLimitMap: { [key: string]: string } = {
        'general-ward': 'general_ward_limit',
        'integrated-care-ward': 'integrated_care_ward_limit',
        'icu': 'icu_limit'
      }

      const limitName = departmentLimitMap[selectedDepartment]
      if (!limitName) return

      const limitData = await safeQuery.public(async () => {
        const { data, error } = await supabasePublic
          .from('survey_limits')
          .select('setting_value')
          .eq('setting_name', limitName)
          .single()
          
        if (error) {
          console.warn('🔄 부서별 제한 조회 실패:', error)
          return null
        }
        
        return data
      })

      const deptLimit = limitData?.setting_value
      if (!deptLimit) return

      const deptCountResult = await safeQuery.public(async () => {
        const { count, error } = await supabasePublic
          .from('surveys')
          .select('*', { count: 'exact', head: true })
          .eq('department', selectedDepartment)
          
        if (error) {
          console.warn('🔄 부서별 개수 조회 실패:', error)
          return null
        }
        
        return { count }
      })

      const deptCount = deptCountResult?.count

      if (deptCount && deptCount >= deptLimit) {
        const deptName = selectedDepartment === 'general-ward' ? '일반병동' :
          selectedDepartment === 'integrated-care-ward' ? '간호·간병통합서비스 병동' :
          selectedDepartment === 'icu' ? '중환자실' : selectedDepartment
        
        throw new Error(`죄송합니다. ${deptName} 응답자 수가 초과되어 설문을 제출할 수 없습니다.`)
      }

      
    } catch (error) {
      console.error('❌ 최종 제출 시 부서별 제한 확인 중 오류:', error)
      throw error
    }
  }

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
