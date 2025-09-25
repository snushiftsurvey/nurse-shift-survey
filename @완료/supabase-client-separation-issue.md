# Supabase 클라이언트 분리 및 PDF 생성 에러 해결

## 클라이언트 분리 이유

### 설계 목적
- **supabase**: 관리자 전용 (persistSession: true)
- **supabasePublic**: 일반 사용자 전용 (persistSession: false)

### 분리 배경
1. **세션 독립성**: Admin과 설문웹이 서로 영향 주지 않도록
2. **보안**: 관리자 세션과 일반 사용자 세션 완전 분리
3. **안정성**: 설문 작성 중 Admin 로그인/로그아웃이 설문에 영향 안 줌

## 발생한 문제

### 메인 문제
```typescript
// 문제: PDF 생성 함수에서 관리자용 클라이언트 사용
import { supabase } from '@/lib/supabase'  // 인증 필요

// 해결: 일반 사용자용 클라이언트 사용
import { supabasePublic } from '@/lib/supabase'  // 익명 접근 가능
```

### 에러 발생 원인
- **로컬**: 개발자가 로그인되어 있어서 supabase 클라이언트도 동작
- **배포**: 익명 사용자 설문 제출 시 supabase 클라이언트 인증 실패
- **결과**: "No API key found in request" 에러

## 해결한 문제들

### 1. Multiple GoTrueClient instances 에러
- **원인**: 중복 import된 createClient
- **해결**: 불필요한 import 제거

### 2. Invalid Refresh Token 에러
- **원인**: 손상된 토큰이 localStorage에 남아있음
- **해결**: Admin 전용 세션 정리 로직 추가

### 3. 데이터베이스 쿼리 타임아웃 (57014)
- **원인**: PDF 바이너리 데이터를 포함한 무거운 JOIN 쿼리
- **해결**: PDF 데이터 제외하고 기본 정보만 조회

### 4. PDF 존재 여부 표시 문제
- **원인**: 존재하지 않는 컬럼명 참조, 잘못된 판단 로직
- **해결**: 올바른 컬럼명 사용, 레코드 존재 여부로 판단

## 주요 주의점

### 1. 클라이언트 용도 구분
- **설문 관련**: 반드시 supabasePublic 사용
- **관리자 관련**: supabase 사용
- **PDF 생성**: 설문의 일부이므로 supabasePublic 사용

### 2. 환경 변수 설정
```bash
# 배포 시 필수
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. 세션 관리
- Admin 로그아웃 시 설문웹 데이터 보존
- localStorage 전체 삭제 금지
- Admin 전용 세션만 정리

### 4. 데이터베이스 쿼리 최적화
- 무거운 바이너리 데이터는 필요시에만 조회
- JOIN 쿼리 시 필드 선택적 조회
- 타임아웃 방지를 위한 단계별 로딩

## 시스템 아키텍처

### 올바른 사용법
```typescript
// 설문 제출
supabasePublic.from('surveys').insert()

// PDF 생성 (설문의 일부)
supabasePublic.from('consent_pdfs').insert()

// 관리자 대시보드
supabase.from('surveys').select()
```

### 잘못된 사용법
```typescript
// 설문 중 관리자 클라이언트 사용 금지
supabase.from('consent_pdfs').insert()  // 에러 발생
```

## 결론

클라이언트 분리 자체는 좋은 설계였으나, PDF 생성 부분에서 용도에 맞지 않는 클라이언트를 사용해서 배포 환경에서만 에러가 발생했음. 각 기능의 성격에 맞는 클라이언트를 일관되게 사용하는 것이 중요함.
