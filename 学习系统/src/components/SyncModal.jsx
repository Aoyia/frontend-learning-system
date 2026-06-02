import React, { useState } from 'react';
import { supabase } from '../storage/supabaseClient.js';

export function SyncModal({ isOpen, onClose, db, user, onSyncComplete, onAuthChange }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return localStorage.getItem('last_sync_time') || '从未同步';
  });

  if (!isOpen) return null;

  // GitHub 一键登录
  async function handleGithubLogin() {
    if (!supabase) return;
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setMessage(`登录错误: ${err.message || '未知错误'}`);
      setLoading(false);
    }
  }

  // 邮箱免密登录 (Magic Link)
  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!supabase || !email) return;
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
      setMessage('📬 登录魔术链接已发送到您的邮箱，请前往查收并点击链接登录！');
    } catch (err) {
      console.error(err);
      setMessage(`发送失败: ${err.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }

  // 退出登录
  async function handleLogout() {
    if (!supabase) return;
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onAuthChange(null);
      setMessage('已成功退出登录');
    } catch (err) {
      console.error(err);
      setMessage(`退出失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // 手动同步
  async function handleSyncNow() {
    if (!user) return;
    setSyncing(true);
    setMessage('');
    try {
      const { syncLocalAndCloud } = await import('../storage/syncService.js');
      const result = await syncLocalAndCloud(db, user.id);
      
      const timeStr = new Date().toLocaleString();
      localStorage.setItem('last_sync_time', timeStr);
      setLastSyncTime(timeStr);
      
      setMessage(`🎉 同步成功！上传了 ${result.uploadCount} 条，拉取了 ${result.downloadCount} 条记录。`);
      
      if (onSyncComplete) {
        await onSyncComplete();
      }
    } catch (err) {
      console.error(err);
      setMessage(`⚠️ 同步失败: ${err.message || '请检查数据库建表或网络连接'}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0a0c12]/75 backdrop-blur-[6px] transition-all duration-300 animate-fade-in">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 dark:border-white/10 border-slate-200/80 bg-[var(--surface)] shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 transform scale-100 flex flex-col animate-summon-cabin"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-black/10">
          <h3 className="text-base md:text-lg font-bold text-[var(--strong-text)] flex items-center gap-2.5">
            <span className="text-xl">☁️</span> 
            <span className="tracking-wide">云端同步与账户</span>
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text2)] hover:text-[var(--text)] hover:bg-white/10 dark:hover:bg-white/10 border-0 cursor-pointer transition-all duration-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {!supabase && (
            <div className="p-4.5 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/10 bg-amber-50 text-amber-800 dark:text-amber-300 text-sm leading-relaxed flex items-start gap-3">
              <span className="text-base select-none mt-0.5">⚠️</span>
              <div>
                <span className="font-bold block mb-1">未配置云同步服务</span>
                系统检测到未配置 Supabase 环境变量，因此无法启用云同步。请在项目根目录配置 <code className="px-1.5 py-0.5 rounded bg-amber-500/20 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-mono text-xs font-semibold">.env.local</code> 文件。
              </div>
            </div>
          )}

          {supabase && !user && (
            <div className="space-y-6">
              <p className="text-sm text-[var(--text2)] leading-relaxed">
                登录后可将您的刷题记录、错题本以及宠物状态同步至云端，实现多设备自动对齐，防止数据丢失。
              </p>

              {/* GitHub 登录 */}
              <button
                onClick={handleGithubLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#24292e] text-white hover:bg-[#1f2327] font-semibold flex items-center justify-center gap-2.5 cursor-pointer shadow-md active:scale-[0.98] hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                通过 GitHub 登录
              </button>

              <div className="flex items-center gap-3 text-[var(--text2)] text-xs">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span>或使用邮箱</span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {/* 邮箱神奇链接登录 */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.75 rounded-xl border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.75 px-4 rounded-xl bg-[var(--accent)] text-white font-semibold cursor-pointer shadow-md hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {loading ? '发送中...' : '发送免密登录链接'}
                </button>
              </form>
            </div>
          )}

          {supabase && user && (
            <div className="space-y-6">
              {/* 用户信息卡片 */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-white/5 dark:bg-white/5 bg-slate-50 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-lg font-bold shadow-md">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[var(--text)] truncate">{user.email}</div>
                  <div className="text-xs text-[var(--text2)] mt-0.5">上次同步：{lastSyncTime}</div>
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="space-y-3">
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:brightness-110 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99] hover:scale-[1.01] transition-all disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)'
                  }}
                >
                  {syncing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      正在同步数据...
                    </>
                  ) : (
                    <>🔄 立即同步进度</>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loading || syncing}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 font-semibold cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  退出登录
                </button>
              </div>
            </div>
          )}

          {/* 状态提示 */}
          {message && (
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-text text-xs leading-relaxed text-center animate-fade-in">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
