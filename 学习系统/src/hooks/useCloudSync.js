import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../storage/supabaseClient.js';

export function useCloudSync({
  db,
  user,
  authLoaded,
  progressCache,
  drillStatCache,
  wrongBookCache,
  petState,
  reloadLocalCaches,
  showToast,
}) {
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);
  const hasPromptedSync = useRef(false);

  const userRef = useRef(user);
  const dbRef = useRef(db);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  // 自动后台同步云端数据
  const autoSyncProgress = useCallback(async () => {
    const currentDb = dbRef.current;
    const currentUser = userRef.current;
    if (!currentDb || !currentUser) return;

    try {
      showToast('☁️ 正在自动同步云端进度...');
      const { syncLocalAndCloud } = await import('../storage/syncService.js');
      const result = await syncLocalAndCloud(currentDb, currentUser.id);

      const timeStr = new Date().toLocaleString();
      localStorage.setItem('last_sync_time', timeStr);
      localStorage.setItem('last_sync_timestamp', Date.now().toString());

      await reloadLocalCaches();
      showToast(`🎉 自动同步成功！上传了 ${result.uploadCount} 条，拉取了 ${result.downloadCount} 条记录。`);
    } catch (err) {
      console.error('自动同步失败:', err);
      showToast('⚠️ 自动同步云端进度失败，请检查网络');
    }
  }, [reloadLocalCaches, showToast]);

  // 处理云同步引导提示的确认与取消
  const handleDismissSyncPrompt = useCallback(() => {
    setShowSyncPrompt(false);
    localStorage.setItem('last_sync_prompt_time', Date.now().toString());
  }, []);

  const handleAcceptSyncPrompt = useCallback(() => {
    setShowSyncPrompt(false);
    localStorage.setItem('last_sync_prompt_time', Date.now().toString());
    setSyncModalOpen(true);
  }, []);

  // 监听用户首次活跃
  useEffect(() => {
    if (!authLoaded) return;

    const handleFirstActivity = async () => {
      const currentUser = userRef.current;

      if (currentUser) {
        // 已登录用户：自动在后台静默同步
        window.removeEventListener('mousedown', handleFirstActivity);
        window.removeEventListener('keydown', handleFirstActivity);
        window.removeEventListener('touchstart', handleFirstActivity);

        if (hasPromptedSync.current) return;
        hasPromptedSync.current = true;

        await autoSyncProgress();
      } else if (supabase) {
        // 未登录用户：只有本地存在有价值的成果数据时，才认为“有必要”提示
        const hasData = Object.values(progressCache).some(done => done === true) ||
                        Object.keys(drillStatCache).length > 0 ||
                        Object.keys(wrongBookCache).length > 0 ||
                        (petState && petState.xp > 0);

        if (!hasData) {
          // 当前没有任何有价值的数据，不提示，并保留事件监听以备后续用户产生数据后触发
          return;
        }

        // 一旦决定提示或走提示判定，立即解除事件监听，防止高频重复判定
        window.removeEventListener('mousedown', handleFirstActivity);
        window.removeEventListener('keydown', handleFirstActivity);
        window.removeEventListener('touchstart', handleFirstActivity);

        if (hasPromptedSync.current) return;
        hasPromptedSync.current = true;

        // 检查冷却时间
        const lastPrompt = localStorage.getItem('last_sync_prompt_time');
        const now = Date.now();
        const COOL_DOWN = 24 * 60 * 60 * 1000; // 24小时

        if (!lastPrompt || now - Number(lastPrompt) > COOL_DOWN) {
          setShowSyncPrompt(true);
        }
      } else {
        // 未启用云同步服务，直接移除监听
        window.removeEventListener('mousedown', handleFirstActivity);
        window.removeEventListener('keydown', handleFirstActivity);
        window.removeEventListener('touchstart', handleFirstActivity);
        hasPromptedSync.current = true;
      }
    };

    window.addEventListener('mousedown', handleFirstActivity);
    window.addEventListener('keydown', handleFirstActivity);
    window.addEventListener('touchstart', handleFirstActivity);

    return () => {
      window.removeEventListener('mousedown', handleFirstActivity);
      window.removeEventListener('keydown', handleFirstActivity);
      window.removeEventListener('touchstart', handleFirstActivity);
    };
  }, [authLoaded, progressCache, drillStatCache, wrongBookCache, petState, autoSyncProgress]);

  return {
    syncModalOpen,
    setSyncModalOpen,
    showSyncPrompt,
    setShowSyncPrompt,
    handleDismissSyncPrompt,
    handleAcceptSyncPrompt,
    autoSyncProgress,
  };
}
