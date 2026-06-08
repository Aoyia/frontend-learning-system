import React, { useState, useEffect } from 'react';

export function PrivateResources({ isOpen, onClose, onSaveSuccess }) {
  const [pat, setPat] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');

  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);

  // 初始化已有配置
  useEffect(() => {
    if (isOpen) {
      setPat(localStorage.getItem('github_pat') || '');
      setRepo(localStorage.getItem('github_repo') || '');
      setBranch(localStorage.getItem('github_branch') || 'main');
      setTestError('');
      setTestSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async (tempPat, tempRepo, tempBranch) => {
    const cleanRepo = tempRepo.trim();
    if (!cleanRepo.includes('/')) {
      throw new Error('仓库路径格式不正确，应为 owner/repo');
    }
    const res = await fetch(`https://api.github.com/repos/${cleanRepo}/branches/${tempBranch}`, {
      headers: {
        'Authorization': `token ${tempPat}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    if (res.status === 200) {
      return true;
    } else if (res.status === 404) {
      throw new Error('未找到仓库或分支，请检查路径/分支名称或 Token 权限');
    } else if (res.status === 401) {
      throw new Error('Token 无效，请检查 Token 拼写与时效');
    } else {
      throw new Error(`连接失败 (HTTP ${res.status})`);
    }
  };

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    setTestError('');
    setTestSuccess(false);

    try {
      await testConnection(pat, repo, branch);
      setTestSuccess(true);
      
      // 保存至本地存储
      localStorage.setItem('github_pat', pat.trim());
      localStorage.setItem('github_repo', repo.trim());
      localStorage.setItem('github_branch', branch.trim());

      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 800);
    } catch (err) {
      setTestError(err.message || '连接失败，请重试');
    } finally {
      setIsTesting(false);
    }
  };

  const clearConfig = () => {
    if (window.confirm('确定要清除本地配置吗？清除后，内存中的私密专属资源模块将被立刻卸载。')) {
      localStorage.removeItem('github_pat');
      localStorage.removeItem('github_repo');
      localStorage.removeItem('github_branch');
      setPat('');
      setRepo('');
      setBranch('main');
      onSaveSuccess(); // 触发 App.jsx 卸载私有模块
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div 
        className="w-full max-w-md bg-surface border border-border/40 rounded-2xl shadow-2xl p-7 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 bg-transparent border-0 text-text-secondary hover:text-text cursor-pointer text-lg font-bold"
          onClick={onClose}
          title="关闭弹窗"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="text-xl font-bold text-text-strong mb-1.5 flex items-center justify-center gap-2">
            <span>🔒</span> GitHub 私密区配置
          </div>
          <p className="text-[13px] text-text-secondary">
            配置细粒度 Token 以在“学习”模块中安全动态注入您的专属项目经验与面试题库。
          </p>
        </div>

        <form onSubmit={handleTestAndSave} className="grid gap-4.5">
          <div className="grid gap-1.5">
            <label className="text-[12.5px] font-semibold text-text-strong">GitHub 个人访问令牌 (PAT)</label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-[13.5px] text-text focus:outline-none focus:border-primary transition-colors duration-150"
            />
            <span className="text-[10px] text-text-secondary leading-relaxed">
              安全提示：推荐仅赋予该私有库的 <code className="bg-surface-alt px-1 py-0.5 rounded font-mono text-[9px]">Contents: Read-only</code> 权限。
            </span>
          </div>

          <div className="grid gap-1.5">
            <label className="text-[12.5px] font-semibold text-text-strong">私有仓库全称 (owner/repo)</label>
            <input
              type="text"
              placeholder="例如：Aoyia/my-private-interview-docs"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-[13.5px] text-text focus:outline-none focus:border-primary transition-colors duration-150"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-[12.5px] font-semibold text-text-strong">分支名称 (Branch)</label>
            <input
              type="text"
              placeholder="默认：main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-[13.5px] text-text focus:outline-none focus:border-primary transition-colors duration-150"
            />
          </div>

          {testError && (
            <div className="p-3 bg-danger-light text-danger border border-danger/10 rounded-lg text-[12.5px] font-medium leading-relaxed">
              ❌ {testError}
            </div>
          )}

          {testSuccess && (
            <div className="p-3 bg-success-light text-success border border-success/10 rounded-lg text-[12.5px] font-medium leading-relaxed">
              ✓ 连接成功！私密模块数据源已安全绑定。
            </div>
          )}

          <div className="flex gap-2 mt-2">
            {localStorage.getItem('github_pat') && (
              <button
                type="button"
                onClick={clearConfig}
                className="px-4 py-2 rounded-lg border border-danger/20 bg-danger-light text-danger font-semibold text-[13.5px] cursor-pointer hover:bg-danger/10 transition-colors duration-200"
              >
                清除配置
              </button>
            )}
            <button
              type="submit"
              disabled={isTesting || testSuccess}
              className="flex-1 py-2 rounded-lg border-0 bg-primary text-white font-semibold text-[13.5px] cursor-pointer hover:bg-primary-hover disabled:bg-primary/50 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isTesting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  测试连接...
                </>
              ) : (
                '测试连接并保存'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
