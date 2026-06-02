import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 如果没有配置 Supabase 环境变量，则返回 null，允许系统完全降级运行在本地 IndexedDB 上
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn('Supabase 环境变量 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未配置，云同步功能将不可用。');
}
