-- 설문 응답 테이블
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gender VARCHAR(10) NOT NULL,
  age INTEGER NOT NULL,
  hire_year INTEGER NOT NULL,
  hire_month INTEGER NOT NULL,
  medical_institution_type VARCHAR(50) NOT NULL,
  medical_institution_location VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  shift_data JSONB NOT NULL,
  work_types JSONB NOT NULL,
  consent_personal_info BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 개인정보 테이블 (동의시에만)
CREATE TABLE personal_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  birth_date VARCHAR(8) NOT NULL,
  phone_number VARCHAR(11) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;

-- 익명 사용자도 INSERT 가능하도록
CREATE POLICY "Allow anonymous insert" ON surveys
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous insert" ON personal_info
  FOR INSERT TO anon
  WITH CHECK (true);

-- 관리자는 모든 데이터 조회 가능
CREATE POLICY "Allow authenticated read" ON surveys
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read" ON personal_info
  FOR SELECT TO authenticated
  USING (true);

