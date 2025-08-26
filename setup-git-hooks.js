#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Git hooks 디렉토리 경로
const hooksDir = path.join('.git', 'hooks');
const preCommitPath = path.join(hooksDir, 'pre-commit');

// pre-commit hook 내용
const preCommitContent = `#!/bin/sh
echo "🔍 Running code quality checks..."

# ESLint 체크
echo "📝 Checking ESLint rules..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors found. Please fix them before committing."
  echo "💡 Run 'npm run lint:fix' to auto-fix some issues."
  exit 1
fi

# TypeScript 타입 체크
echo "🔍 Checking TypeScript types..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Please fix them before committing."
  exit 1
fi

echo "✅ All checks passed! Proceeding with commit..."
`;

try {
  // .git/hooks 디렉토리가 존재하는지 확인
  if (!fs.existsSync(hooksDir)) {
    console.log('❌ .git directory not found. Make sure you are in a git repository.');
    process.exit(1);
  }

  // pre-commit hook 파일 생성
  fs.writeFileSync(preCommitPath, preCommitContent);
  
  // 실행 권한 부여 (Unix 시스템의 경우)
  if (process.platform !== 'win32') {
    fs.chmodSync(preCommitPath, '755');
  }

  console.log('✅ Git pre-commit hook has been set up successfully!');
  console.log('📋 This hook will run ESLint and TypeScript checks before each commit.');
  console.log('💡 To bypass the hook (not recommended), use: git commit --no-verify');
  
} catch (error) {
  console.error('❌ Error setting up git hooks:', error.message);
  process.exit(1);
}
