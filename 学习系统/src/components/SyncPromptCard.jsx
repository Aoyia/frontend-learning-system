import React from 'react';

/**
 * 云同步引导提示卡片 (浮动气泡)
 * @param {Object} props
 * @param {Function} props.onOpenSync 点击立即绑定的回调
 * @param {Function} props.onClose 点击关闭/暂时不用的回调
 */
export function SyncPromptCard({ onOpenSync, onClose }) {
  return (
    <div 
      className="fixed bottom-6 right-6 z-[999] w-[calc(100vw-48px)] sm:w-[360px] overflow-hidden rounded-2xl border border-white/10 dark:border-white/10 border-slate-200 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl animate-slide-up flex flex-col gap-4"
      style={{
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="flex items-start gap-3.5">
        {/* 精致的云朵图标，带轻微呼吸感 */}
        <div 
          className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/10 text-[var(--accent)] flex items-center justify-center text-xl select-none"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        >
          ☁️
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[var(--strong-text)] leading-5 flex items-center gap-1.5">
            开启云端同步
          </h4>
          <p className="text-[12px] text-[var(--text2)] mt-1.5 leading-relaxed">
            绑定账户以自动同步刷题进度、错题本与战宠修为，多设备对齐，防止数据丢失。
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--text2)] hover:text-[var(--text)] hover:bg-white/10 transition cursor-pointer border-0 bg-transparent text-sm"
          title="关闭提示"
        >
          ✕
        </button>
      </div>
      
      <div className="flex items-center justify-end gap-2.5">
        <button
          onClick={onClose}
          className="px-3.5 py-1.75 rounded-lg border border-[var(--border)] bg-transparent hover:bg-white/5 text-[var(--text2)] hover:text-[var(--text)] text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
        >
          暂时不用
        </button>
        <button
          onClick={onOpenSync}
          className="px-4 py-1.75 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer shadow-md hover:brightness-110 active:scale-[0.98] transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)'
          }}
        >
          立即绑定
        </button>
      </div>
    </div>
  );
}
