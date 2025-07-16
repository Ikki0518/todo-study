#!/usr/bin/env node

/**
 * 管理者アカウント作成スクリプト
 * 使用方法: node scripts/create-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// 環境変数を読み込み
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // サービスロールキーが必要

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('💡 .envファイルに以下を追加してください:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createTenant(tenantCode, tenantName) {
  console.log(`📋 テナント「${tenantCode}」を作成中...`);
  
  const { data, error } = await supabase
    .from('tenants')
    .upsert({
      code: tenantCode,
      name: tenantName,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ テナント作成エラー:', error.message);
    return null;
  }

  console.log('✅ テナント作成完了');
  return data;
}

async function createAdminUser(email, password, name, phoneNumber, tenantCode) {
  console.log('👤 管理者ユーザーを作成中...');

  // 1. Supabase Authでユーザー作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // メール確認をスキップ
  });

  if (authError) {
    console.error('❌ 認証ユーザー作成エラー:', authError.message);
    return null;
  }

  console.log('✅ 認証ユーザー作成完了');

  // 2. プロファイル作成
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: email,
      name: name,
      phone_number: phoneNumber,
      role: 'INSTRUCTOR',
      tenant_code: tenantCode,
      user_id: `${tenantCode}-0001`, // 管理者は常に0001
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) {
    console.error('❌ プロファイル作成エラー:', profileError.message);
    // 認証ユーザーを削除
    await supabase.auth.admin.deleteUser(authData.user.id);
    return null;
  }

  console.log('✅ プロファイル作成完了');
  return { auth: authData, profile: profileData };
}

async function main() {
  console.log('🚀 管理者アカウント作成ツール');
  console.log('=====================================');
  console.log('');

  try {
    // テナント情報入力
    console.log('📋 テナント情報を入力してください:');
    const tenantCode = await question('テナントコード (例: TC): ');
    const tenantName = await question('テナント名 (例: 東京塾): ');
    
    if (!tenantCode || !tenantName) {
      console.error('❌ テナント情報は必須です');
      process.exit(1);
    }

    // 管理者情報入力
    console.log('');
    console.log('👤 管理者情報を入力してください:');
    const email = await question('メールアドレス: ');
    const name = await question('名前: ');
    const phoneNumber = await question('電話番号 (例: 090-1234-5678): ');
    
    if (!email || !name || !phoneNumber) {
      console.error('❌ 管理者情報は必須です');
      process.exit(1);
    }

    const password = await questionHidden('パスワード: ');
    const confirmPassword = await questionHidden('パスワード確認: ');

    if (password !== confirmPassword) {
      console.error('❌ パスワードが一致しません');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ パスワードは6文字以上で入力してください');
      process.exit(1);
    }

    console.log('');
    console.log('📝 入力内容確認:');
    console.log(`   テナント: ${tenantName} (${tenantCode})`);
    console.log(`   管理者: ${name} (${email})`);
    console.log(`   電話番号: ${phoneNumber}`);
    console.log(`   ユーザーID: ${tenantCode}-0001`);
    console.log('');

    const confirm = await question('この内容で作成しますか？ (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ 作成をキャンセルしました');
      process.exit(0);
    }

    console.log('');
    console.log('🔧 作成処理を開始します...');

    // テナント作成
    const tenant = await createTenant(tenantCode, tenantName);
    if (!tenant) {
      process.exit(1);
    }

    // 管理者ユーザー作成
    const admin = await createAdminUser(email, password, name, phoneNumber, tenantCode);
    if (!admin) {
      process.exit(1);
    }

    console.log('');
    console.log('🎉 管理者アカウント作成完了！');
    console.log('=====================================');
    console.log(`✅ テナント: ${tenantName} (${tenantCode})`);
    console.log(`✅ 管理者ユーザーID: ${tenantCode}-0001`);
    console.log(`✅ メールアドレス: ${email}`);
    console.log(`✅ 名前: ${name}`);
    console.log('');
    console.log('🔗 ログイン方法:');
    console.log(`   1. アプリケーションにアクセス`);
    console.log(`   2. ユーザーID: ${email} または ${tenantCode}-0001`);
    console.log(`   3. パスワード: (設定したパスワード)`);
    console.log('');
    console.log('⚙️ 次のステップ:');
    console.log('   1. 管理者でログイン');
    console.log('   2. 「⚙️ ユーザー管理」タブをクリック');
    console.log('   3. 講師・生徒のユーザーを作成');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// スクリプト実行
main();