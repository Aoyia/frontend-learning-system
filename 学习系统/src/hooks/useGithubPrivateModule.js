import { useEffect, useState, useCallback } from 'react';
import { LEARNING_CONTENT } from '../../data/learning-content.js';
import { setActiveContent } from '../utils/quiz.js';

export function useGithubPrivateModule({
  isAdmin,
  page,
  currentModuleId,
  currentDocIdx,
  showToast,
}) {
  const [contentVersion, setContentVersion] = useState(0);

  // 核心拉取：在运行时通过 GitHub API 将私密仓库平铺文件树组装为临时的系统内置模块
  const loadPrivateModule = useCallback(async () => {
    if (!isAdmin) {
      const originalLen = LEARNING_CONTENT.modules.length;
      LEARNING_CONTENT.modules = LEARNING_CONTENT.modules.filter(m => m.id !== 'private-interview');
      if (LEARNING_CONTENT.modules.length !== originalLen) {
        setActiveContent(LEARNING_CONTENT);
        setContentVersion(v => v + 1);
      }
      return;
    }

    const pat = localStorage.getItem('github_pat');
    const repo = localStorage.getItem('github_repo');
    const branch = localStorage.getItem('github_branch') || 'main';

    if (!pat || !repo) {
      const originalLen = LEARNING_CONTENT.modules.length;
      LEARNING_CONTENT.modules = LEARNING_CONTENT.modules.filter(m => m.id !== 'private-interview');
      if (LEARNING_CONTENT.modules.length !== originalLen) {
        setActiveContent(LEARNING_CONTENT);
        setContentVersion(v => v + 1);
      }
      return;
    }

    try {
      // 动态向 GitHub 请求平铺的完整树架构
      const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      if (!res.ok) throw new Error(`拉取失败 (HTTP ${res.status})`);
      const data = await res.json();
      const tree = data.tree || [];

      // 仅保留所有的 Markdown 文档，并按字母序对齐
      const mdFiles = tree
        .filter(item => item.type === 'blob' && item.path.endsWith('.md'))
        .sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));

      const privateModule = {
        id: 'private-interview',
        name: '🔒 私密面试资源',
        icon: '🔒',
        desc: '实时拉取您的 GitHub 私密仓库，包含您的专属项目经验与面试题库。',
        docs: mdFiles.map(file => ({
          title: file.path.replace(/\.md$/, '').split('/').pop(), // 展示叶子文件名
          path: file.path,
          content: '', // 点击时懒加载拉取
          difficulty: '进阶',
          docMeta: {
            sourceType: 'original',
            updated: '实时拉取'
          },
          quiz: []
        }))
      };

      LEARNING_CONTENT.modules = LEARNING_CONTENT.modules.filter(m => m.id !== 'private-interview');
      LEARNING_CONTENT.modules.push(privateModule);
      setActiveContent(LEARNING_CONTENT);
      setContentVersion(v => v + 1);

      // 后台静默并发拉取所有私密文档内容并解析出题目，保证“模块刷题”与“随堂测验”开箱即用
      mdFiles.forEach(async (file, idx) => {
        try {
          const docRes = await fetch(`https://api.github.com/repos/${repo}/contents/${file.path}?ref=${branch}`, {
            headers: {
              'Authorization': `token ${pat}`,
              'Accept': 'application/vnd.github+json'
            }
          });
          if (docRes.ok) {
            const docData = await docRes.json();
            const rawMarkdown = decodeURIComponent(escape(atob(docData.content.replace(/\s/g, ''))));
            
            const currentMod = LEARNING_CONTENT.modules.find(m => m.id === 'private-interview');
            const targetDoc = currentMod?.docs[idx];
            if (targetDoc) {
              targetDoc.content = rawMarkdown;
              
              const quizMatch = rawMarkdown.match(/<!--\s*quiz:\s*([\s\S]*?)\s*-->/);
              if (quizMatch) {
                try {
                  const parsedQuiz = JSON.parse(quizMatch[1]);
                  if (Array.isArray(parsedQuiz)) {
                    targetDoc.quiz = parsedQuiz;
                  }
                } catch (e) {
                  console.error(`静默解析 [${file.path}] 测验题目失败:`, e);
                }
              }
              // 触发应用状态的局部响应式更新
              setActiveContent({ ...LEARNING_CONTENT });
              setContentVersion(v => v + 1);
            }
          }
        } catch (e) {
          console.error(`静默预加载 [${file.path}] 失败:`, e);
        }
      });
    } catch (err) {
      console.error('拉取私密代码树失败:', err);
      showToast('⚠️ 拉取私密资源目录失败，请检查配置与网络');
    }
  }, [isAdmin, showToast]);

  // 初始化或登录态发生变化时触发拉取
  useEffect(() => {
    loadPrivateModule();
  }, [loadPrivateModule]);

  // 监听私有文章的懒加载拉取与题目解析拦截
  useEffect(() => {
    if (currentModuleId !== 'private-interview' || page !== 'learn') return;

    const module = LEARNING_CONTENT.modules.find(m => m.id === 'private-interview');
    const doc = module?.docs[currentDocIdx];
    if (!doc || doc.content) return; // 已经加载过内容，跳过

    const loadContent = async () => {
      const savedPat = localStorage.getItem('github_pat');
      const savedRepo = localStorage.getItem('github_repo');
      const savedBranch = localStorage.getItem('github_branch');
      if (!savedPat || !savedRepo) return;

      try {
        showToast('🔒 正在实时拉取私密内容...');
        const res = await fetch(`https://api.github.com/repos/${savedRepo}/contents/${doc.path}?ref=${savedBranch}`, {
          headers: {
            'Authorization': `token ${savedPat}`,
            'Accept': 'application/vnd.github+json'
          }
        });
        if (!res.ok) throw new Error(`加载文件失败 (HTTP ${res.status})`);
        const data = await res.json();

        // Base64 解码，支持中文字符集
        const rawMarkdown = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));

        // 注入文档内容
        doc.content = rawMarkdown;

        // 提取文档底部的随堂测验，规范示例：<!-- quiz: [...] -->
        const quizMatch = rawMarkdown.match(/<!--\s*quiz:\s*([\s\S]*?)\s*-->/);
        if (quizMatch) {
          try {
            const parsedQuiz = JSON.parse(quizMatch[1]);
            if (Array.isArray(parsedQuiz)) {
              doc.quiz = parsedQuiz;
            }
          } catch (e) {
            console.error('解析私密测验题目失败:', e);
          }
        }

        setActiveContent(LEARNING_CONTENT);
        setContentVersion(v => v + 1);
        showToast('🔒 私密内容拉取成功！');
      } catch (err) {
        console.error('加载私密资源文章失败:', err);
        doc.content = `### ❌ 加载失败\n\n无法从 GitHub 仓库拉取该文档内容，请检查 Token 权限或网络连接。\n\n错误信息：${err.message}`;
        setContentVersion(v => v + 1);
      }
    };

    loadContent();
  }, [currentModuleId, currentDocIdx, page, contentVersion, showToast]);

  return { contentVersion, loadPrivateModule };
}
