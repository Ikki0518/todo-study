// Supabaseデータベース接続のエクスポート
export {
  getSupabase,
  initializeSupabase,
  setupDatabase,
  query,
  transaction,
  subscribeToTable,
  closeDatabase
} from './supabase';

// デフォルトエクスポート
export { getSupabase as default } from './supabase';