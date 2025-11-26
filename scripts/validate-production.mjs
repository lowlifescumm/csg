#!/usr/bin/env node

const PROD_URL = 'https://cosmicspiritguide.com';

const endpoints = [
  { path: '/login', method: 'GET', expectedStatus: 200 },
  { path: '/api/health', method: 'GET', expectedStatus: 200 },
  { path: '/credits', method: 'GET', expectedStatus: 200 },
  { path: '/reset-password', method: 'GET', expectedStatus: 200 },
  { path: '/api/auth/user', method: 'GET', expectedStatus: 200 },
];

async function validateEndpoint({ path, method, expectedStatus }) {
  const url = `${PROD_URL}${path}`;
  try {
    const response = await fetch(url, { method });
    const status = response.status;
    const isOk = status === expectedStatus;
    const contentLength = response.headers.get('content-length') || 'unknown';
    
    console.log(
      `${isOk ? '✅' : '❌'} ${method} ${path} → ${status} (expected ${expectedStatus}) [${contentLength} bytes]`
    );
    
    return { path, status, expectedStatus, isOk };
  } catch (error) {
    console.error(`❌ ${method} ${path} → ERROR: ${error.message}`);
    return { path, status: 'ERROR', expectedStatus, isOk: false, error: error.message };
  }
}

async function main() {
  console.log(`\n🔍 Validating production endpoints at ${PROD_URL}\n`);
  console.log('='.repeat(60));
  
  const results = await Promise.all(endpoints.map(validateEndpoint));
  
  console.log('='.repeat(60));
  const passed = results.filter(r => r.isOk).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} endpoints passed\n`);
  
  const failed = results.filter(r => !r.isOk);
  if (failed.length > 0) {
    console.log('⚠️  Failed endpoints:');
    failed.forEach(r => {
      console.log(`   - ${r.path}: ${r.status} (expected ${r.expectedStatus})`);
    });
  }
  
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


