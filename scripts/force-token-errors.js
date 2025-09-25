// 브라우저 콘솔에서 실행 - 토큰 에러 강제 발생

console.log('💥 토큰 에러 강제 생성 스크립트');

// 1. Refresh Token 손상시키기
function corruptRefreshToken() {
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') && localStorage.getItem(key)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.refresh_token) {
          data.refresh_token = 'corrupted_' + data.refresh_token.substring(10);
          localStorage.setItem(key, JSON.stringify(data));
          console.log('🔥 Refresh Token 손상:', key);
        }
      } catch (e) {}
    }
  });
}

// 2. Access Token 손상시키기
function corruptAccessToken() {
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') && localStorage.getItem(key)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.access_token) {
          data.access_token = 'corrupted_' + data.access_token.substring(10);
          localStorage.setItem(key, JSON.stringify(data));
          console.log('🔥 Access Token 손상:', key);
        }
      } catch (e) {}
    }
  });
}

// 3. 세션 만료시키기
function expireSession() {
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') && localStorage.getItem(key)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.expires_at) {
          data.expires_at = Math.floor(Date.now() / 1000) - 3600; // 1시간 전으로 설정
          localStorage.setItem(key, JSON.stringify(data));
          console.log('⏰ 세션 만료시킴:', key);
        }
      } catch (e) {}
    }
  });
}

// 사용법 출력
console.log(`
📋 사용법:
- corruptRefreshToken() : Refresh Token 손상
- corruptAccessToken()  : Access Token 손상  
- expireSession()       : 세션 강제 만료
`);

window.corruptRefreshToken = corruptRefreshToken;
window.corruptAccessToken = corruptAccessToken;
window.expireSession = expireSession;
