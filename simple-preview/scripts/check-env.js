#!/usr/bin/env node

// 環境変数チェックスクリプト
console.log('=== 環境変数チェック ===');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

let allValid = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const isValid = value && 
    value !== 'your_supabase_project_url' && 
    value !== 'your_supabase_anon_key';
  
  console.log(`${varName}: ${isSet ? '✅ 設定済み' : '❌ 未設定'} ${isValid ? '(有効)' : '(無効)'}`);
  
  if (varName === 'VITE_SUPABASE_URL' && value) {
    console.log(`  URL: ${value.substring(0, 30)}...`);
  }
  
  if (!isValid) {
    allValid = false;
  }
});

console.log('\n=== 推奨設定 ===');
if (!allValid) {
  console.log('Vercel環境変数を設定してください:');
  console.log('1. Vercel Dashboard → Project → Settings → Environment Variables');
  console.log('2. 以下の変数を追加:');
  console.log('   VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.log('3. Redeploy');
} else {
  console.log('✅ 環境変数は正しく設定されています');
}

console.log('\n=== Supabase設定確認 ===');
console.log('Supabase Dashboard → Settings → API で以下を確認:');
console.log('- Project URL');
console.log('- anon/public key');
console.log('- Row Level Security (RLS) が有効');
console.log('- Authentication → Settings → Email confirmations が無効');

process.exit(allValid ? 0 : 1);