'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { SurveyData, PersonalInfo } from '@/lib/types'

interface SurveyState {
  currentStep: string
  surveyData: Partial<SurveyData>
  personalInfo: Partial<PersonalInfo>
  isLoading: boolean
  error: string | null
  surveyStarted: boolean
}

type SurveyAction =
  | { type: 'SET_STEP'; payload: string }
  | { type: 'UPDATE_SURVEY_DATA'; payload: Partial<SurveyData> }
  | { type: 'UPDATE_PERSONAL_INFO'; payload: Partial<PersonalInfo> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'START_SURVEY' }
  | { type: 'RESET_SURVEY' }
  | { type: 'FORCE_CLEAR_ALL' }

const initialState: SurveyState = {
  currentStep: '/',
  surveyData: {},
  personalInfo: {},
  isLoading: false,
  error: null,
  surveyStarted: false,
}

function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'UPDATE_SURVEY_DATA':
      return { 
        ...state, 
        surveyData: { ...state.surveyData, ...action.payload }
      }
    case 'UPDATE_PERSONAL_INFO':
      return { 
        ...state, 
        personalInfo: { ...state.personalInfo, ...action.payload }
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'START_SURVEY':
      return { ...state, surveyStarted: true }
    case 'RESET_SURVEY':
      return initialState
    case 'FORCE_CLEAR_ALL':
      // 불특정 다수 사용을 위한 완전 초기화
      //console.log('FORCE_CLEAR_ALL: 모든 데이터 완전 초기화')
      return {
        ...initialState,
        currentStep: '/',
        surveyData: {},
        personalInfo: {},
        surveyStarted: false
      }
    default:
      return state
  }
}

const SurveyContext = createContext<{
  state: SurveyState
  dispatch: React.Dispatch<SurveyAction>
} | null>(null)

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(surveyReducer, initialState)

  // 🔒 불특정 다수 사용을 위한 완전 초기화
  useEffect(() => {
    console.log('SurveyProvider 마운트 - 완전 초기화 실행')
    
    // 1. 강제 초기화
    dispatch({ type: 'FORCE_CLEAR_ALL' })
    
    // 2. 브라우저 히스토리 변경 시에도 초기화
    const handlePopState = () => {
      console.log('🔒 브라우저 히스토리 변경 감지 - 데이터 초기화')
      dispatch({ type: 'FORCE_CLEAR_ALL' })
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return (
    <SurveyContext.Provider value={{ state, dispatch }}>
      {children}
    </SurveyContext.Provider>
  )
}

export function useSurvey() {
  const context = useContext(SurveyContext)
  if (!context) {
    throw new Error('useSurvey must be used within a SurveyProvider')
  }
  return context
}
