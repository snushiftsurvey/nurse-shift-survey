# Vercel Cron Job 로컬 테스트 스크립트 (Windows PowerShell)

Write-Host "🔄 Cron Job 로컬 테스트 시작..." -ForegroundColor Cyan
Write-Host ""

# .env.local에서 CRON_SECRET 읽기
$envFile = ".env.local"
if (Test-Path $envFile) {
    $cronSecret = Get-Content $envFile | Where-Object { $_ -match "^CRON_SECRET=" } | ForEach-Object { $_.Split("=")[1] }
} else {
    $cronSecret = $env:CRON_SECRET
}

if (-not $cronSecret) {
    Write-Host "⚠️  CRON_SECRET 환경변수가 없습니다." -ForegroundColor Yellow
    Write-Host "📝 .env.local에 CRON_SECRET을 추가해주세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "🔐 CRON_SECRET: $($cronSecret.Substring(0, [Math]::Min(10, $cronSecret.Length)))..." -ForegroundColor Green
Write-Host ""

# API 호출
Write-Host "📡 API 호출 중..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $cronSecret"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:3006/api/cron/keep-alive" `
        -Method Post `
        -Headers $headers
    
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
    Write-Host ""
    
    if ($response.success -eq $true) {
        Write-Host "✅ Cron Job 테스트 성공!" -ForegroundColor Green
        Write-Host "📊 Supabase에서 로그 확인:" -ForegroundColor Cyan
        Write-Host "   SELECT * FROM cron_logs ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Gray
    } else {
        Write-Host "❌ Cron Job 테스트 실패" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ API 호출 실패: $_" -ForegroundColor Red
    Write-Host "🔍 서버가 실행 중인지 확인해주세요 (npm run dev)" -ForegroundColor Yellow
    exit 1
}

