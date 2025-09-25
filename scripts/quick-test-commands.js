// 브라우저 콘솔에서 빠른 테스트를 위한 유틸리티 함수들

window.testUtils = {
  
  // 현재 localStorage 상태 출력
  showStorage() {
    console.log('📊 현재 localStorage 상태:');
    console.table(
      Object.keys(localStorage)
        .filter(key => key.includes('supabase') || key.startsWith('sb-'))
        .reduce((obj, key) => {
          const value = localStorage.getItem(key);
          obj[key] = value ? value.substring(0, 50) + '...' : 'null';
          return obj;
        }, {})
    );
  },

  // Admin 세션 정보만 출력  
  showAdminSession() {
    console.log('🔐 Admin 세션 상태:');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') && localStorage.getItem(key)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.user || data.access_token) {
            console.log(`Key: ${key}`);
            console.log('User:', data.user?.email || 'none');
            console.log('Token expires:', data.expires_at ? new Date(data.expires_at * 1000) : 'none');
            console.log('---');
          }
        } catch (e) {}
      }
    });
  },

  // 설문 관련 localStorage 확인
  showSurveyData() {
    console.log('📝 설문 임시저장 데이터:');
    Object.keys(localStorage).forEach(key => {
      if (key.includes('survey') || key.includes('draft') || key.includes('consent')) {
        console.log(`${key}:`, localStorage.getItem(key)?.substring(0, 100));
      }
    });
  },

  // Admin 세션만 강제 삭제
  clearAdminOnly() {
    let cleared = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') && localStorage.getItem(key)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          // Admin 세션으로 판단되는 데이터만 삭제
          if (data.user?.email?.includes('admin') || data.access_token) {
            localStorage.removeItem(key);
            cleared++;
            console.log('🗑️ Admin 세션 삭제:', key);
          }
        } catch (e) {}
      }
    });
    console.log(`✅ ${cleared}개 Admin 세션 삭제 완료`);
  },

  // 페이지 새로고침 없이 상태 초기화
  resetAdminState() {
    console.log('🔄 Admin 상태만 초기화...');
    this.clearAdminOnly();
    // 강제로 로그인 페이지로 이동
    if (window.location.pathname.includes('/admin')) {
      window.location.href = '/admin';
    }
  },

  // 네트워크 요청 모니터링 시작
  startNetworkMonitoring() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options] = args;
      if (url.toString().includes('supabase')) {
        console.log('🌐 Supabase 요청:', url, options?.method || 'GET');
        
        return originalFetch.apply(this, arguments)
          .then(response => {
            console.log('📡 응답:', response.status, url);
            return response;
          })
          .catch(error => {
            console.error('❌ 요청 실패:', error, url);
            throw error;
          });
      }
      return originalFetch.apply(this, arguments);
    };
    console.log('✅ 네트워크 모니터링 시작');
  },

  // 도움말 출력
  help() {
    console.log(`
🧪 테스트 유틸리티 사용법:

testUtils.showStorage()        - localStorage 전체 상태
testUtils.showAdminSession()   - Admin 세션 정보만
testUtils.showSurveyData()     - 설문 임시저장 데이터
testUtils.clearAdminOnly()     - Admin 세션만 삭제
testUtils.resetAdminState()    - Admin 상태 완전 초기화
testUtils.startNetworkMonitoring() - 네트워크 요청 추적
testUtils.help()               - 이 도움말

🔥 강제 에러 생성: (force-token-errors.js 먼저 실행)
corruptRefreshToken()
corruptAccessToken()  
expireSession()
    `);
  }
};

console.log('🛠️ 테스트 유틸리티 로드 완료');
console.log('💡 testUtils.help() 로 사용법 확인');
