const fs = require('fs');
const path = require('path');

// 간단한 MIME 판별: 확장자 기반 (.png | .jpg | .jpeg)
function detectMimeType(filePath) {
  const clean = filePath.split('?')[0];
  const ext = path.extname(clean).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  // 기본값 (필요 시 보완)
  return 'application/octet-stream';
}

// 파일 헤더를 기반으로 간이 시그니처 확인 (로그용)
function guessMimeByMagic(base64) {
  // 앞부분만 확인
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png (magic)';
  if (base64.startsWith('/9j/4AAQSkZJRg')) return 'image/jpeg (magic)';
  return 'unknown';
}

// 이미지 파일을 Base64로 변환하는 함수
function imageToBase64(imagePath) {
  try {
    const cleanPath = imagePath.split('?')[0];
    const imageBuffer = fs.readFileSync(cleanPath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = detectMimeType(cleanPath);
    return { dataUrl: `data:${mimeType};base64,${base64String}`, base64: base64String, mimeType };
  } catch (error) {
    console.error('이미지 파일 읽기 오류:', error);
    return null;
  }
}

// 사용법: node scripts/update-researcher-signature.js [이미지경로]
const inputArg = process.argv[2];
const defaultFile = path.join(__dirname, '..', 'public', 'images', 'signature', 'sign.png');
const signImagePath = inputArg ? path.resolve(inputArg) : defaultFile;
console.log('이미지 파일 경로:', signImagePath);

// 파일 존재 확인
const cleanPath = signImagePath.split('?')[0];
if (!fs.existsSync(cleanPath)) {
  console.error('❌ 이미지 파일을 찾을 수 없습니다:', cleanPath);
  process.exit(1);
}

const result = imageToBase64(signImagePath);

if (result) {
  const { dataUrl, base64, mimeType } = result;

  // 간이 매직 헤더 확인
  const magic = guessMimeByMagic(base64);
  const prefix = dataUrl.substring(0, 60);
  console.log('✅ 변환 성공');
  console.log(' - MIME (by ext):', mimeType);
  console.log(' - MAGIC GUESS  :', magic);
  console.log(' - LENGTH       :', dataUrl.length);
  console.log(' - PREFIX       :', prefix + '...');

  // Base64 데이터를 파일로 저장 (검증/수동 SQL용)
  const outputPath = path.join(__dirname, 'signature-base64.txt');
  fs.writeFileSync(outputPath, dataUrl);
  console.log('💾 Base64 데이터 저장 완료:', outputPath);

  console.log('\n📋 다음 SQL로 연구원 서명을 업데이트할 수 있습니다 (예시):');
  console.log(`UPDATE researcher_profiles SET signature_image = '${dataUrl.replace(/'/g, "''").substring(0, 100)}...' WHERE is_active = true;`);
} else {
  console.error('❌ Base64 변환 실패');
  process.exit(1);
}
