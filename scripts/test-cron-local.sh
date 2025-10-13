#!/bin/bash

# Vercel Cron Job 로컬 테스트 스크립트

echo "🔄 Cron Job 로컬 테스트 시작..."
echo ""

# .env.local에서 CRON_SECRET 읽기
if [ -f .env.local ]; then
  export $(cat .env.local | grep CRON_SECRET | xargs)
fi

if [ -z "$CRON_SECRET" ]; then
  echo "⚠️  CRON_SECRET 환경변수가 없습니다."
  echo "📝 .env.local에 CRON_SECRET을 추가해주세요."
  exit 1
fi

echo "🔐 CRON_SECRET: ${CRON_SECRET:0:10}..."
echo ""

# API 호출
echo "📡 API 호출 중..."
RESPONSE=$(curl -s -X POST http://localhost:3006/api/cron/keep-alive \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq .

# 성공 여부 확인
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo ""
  echo "✅ Cron Job 테스트 성공!"
  echo "📊 Supabase에서 로그 확인:"
  echo "   SELECT * FROM cron_logs ORDER BY created_at DESC LIMIT 5;"
else
  echo ""
  echo "❌ Cron Job 테스트 실패"
  echo "🔍 에러 확인이 필요합니다."
  exit 1
fi

