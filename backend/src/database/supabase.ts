import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

// Supabaseクライアントのシングルトンインスタンス
let supabase: SupabaseClient | null = null;

// Supabase接続の初期化
export function initializeSupabase(): SupabaseClient {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = config.supabase.url;
  const supabaseKey = config.supabase.serviceKey; // サーバーサイドではservice keyを使用

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Service Key are required');
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  logger.info('Supabase client initialized');
  return supabase;
}

// Supabaseクライアントを取得
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    return initializeSupabase();
  }
  return supabase;
}

// データベース接続のセットアップ
export async function setupDatabase(): Promise<void> {
  try {
    const supabaseClient = initializeSupabase();
    
    // 接続テスト（簡単なクエリを実行）
    const { data, error } = await supabaseClient
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    logger.info('Supabase connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to Supabase:', error);
    throw error;
  }
}

// クエリ実行のヘルパー関数（互換性のため）
export async function query<T = any>(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  params?: any
): Promise<T[]> {
  const start = Date.now();
  
  try {
    const supabaseClient = getSupabase();
    let queryBuilder: any;
    
    switch (operation) {
      case 'select':
        queryBuilder = supabaseClient.from(table).select(params?.select || '*');
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }
        if (params?.order) {
          queryBuilder = queryBuilder.order(params.order.column, {
            ascending: params.order.ascending !== false
          });
        }
        if (params?.limit) {
          queryBuilder = queryBuilder.limit(params.limit);
        }
        break;
        
      case 'insert':
        queryBuilder = supabaseClient.from(table).insert(params?.data);
        if (params?.select) {
          queryBuilder = queryBuilder.select(params.select);
        }
        break;
        
      case 'update':
        queryBuilder = supabaseClient.from(table).update(params?.data);
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }
        if (params?.select) {
          queryBuilder = queryBuilder.select(params.select);
        }
        break;
        
      case 'delete':
        queryBuilder = supabaseClient.from(table);
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }
        queryBuilder = queryBuilder.delete();
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    const { data, error } = await queryBuilder;
    const duration = Date.now() - start;
    
    if (error) {
      throw error;
    }
    
    logger.debug('Supabase query executed', {
      table,
      operation,
      duration,
      rows: data?.length || 0,
    });
    
    return (data || []) as T[];
  } catch (error) {
    logger.error('Supabase query error', {
      table,
      operation,
      error,
    });
    throw error;
  }
}

// トランザクション処理（Supabaseではrpc関数を使用）
export async function transaction<T>(
  callback: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const supabaseClient = getSupabase();
  
  try {
    // Supabaseではトランザクションは主にデータベース関数（rpc）で処理
    // ここでは単純にクライアントを渡す
    const result = await callback(supabaseClient);
    return result;
  } catch (error) {
    logger.error('Supabase transaction error:', error);
    throw error;
  }
}

// リアルタイムサブスクリプションのヘルパー
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const supabaseClient = getSupabase();
  
  let subscription = supabaseClient
    .channel(`public:${table}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: table,
        ...(filter && { filter })
      }, 
      callback
    )
    .subscribe();
    
  return subscription;
}

// データベース接続のクリーンアップ
export async function closeDatabase(): Promise<void> {
  // Supabaseクライアントは明示的なクローズが不要
  logger.info('Supabase client cleanup completed');
}