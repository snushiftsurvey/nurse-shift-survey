const fs = require('fs');
const path = require('path');

// 이미지 파일을 Base64로 변환하는 함수
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('이미지 파일 읽기 오류:', error);
    return null;
  }
}

// sign.jpg를 Base64로 변환
const signImagePath = path.join(__dirname, '..', 'public', 'images', 'signature', 'sign.jpg');
console.log('이미지 파일 경로:', signImagePath);

// 파일 존재 확인
if (!fs.existsSync(signImagePath)) {
  console.error('❌ 이미지 파일을 찾을 수 없습니다:', signImagePath);
  process.exit(1);
}

const base64Data = imageToBase64(signImagePath);

if (base64Data) {
  console.log('✅ Base64 변환 성공');
  console.log('📏 Base64 데이터 길이:', base64Data.length);
  console.log('🎯 Base64 데이터 미리보기:', base64Data.substring(0, 100) + '...');
  
  // Base64 데이터를 파일로 출력 (SQL 업데이트용)
  const outputPath = path.join(__dirname, 'signature-base64.txt');
  fs.writeFileSync(outputPath, base64Data);
  console.log('💾 Base64 데이터 저장 완료:', outputPath);
  
  console.log('\n📋 다음 SQL을 실행하여 연구원 서명을 업데이트하세요:');
  console.log(`UPDATE researcher_profiles SET signature_image = '${base64Data.length > 1000 ? base64Data.substring(0, 100) + '...' : base64Data}' WHERE name = '김연구';`);
} else {
  console.error('❌ Base64 변환 실패');
  process.exit(1);
}
