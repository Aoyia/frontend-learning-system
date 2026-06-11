# 目录锚点导航与 URL Hash 同步设计规范

该规范定义了前端学习系统中文章目录（TOC）点击时与浏览器 URL Hash 保持同步，并支持在进入页面、刷新或点击浏览器前进/后退时自动定位至相应标题的实现方案。

## 1. 业务需求
* **更新地址栏**：用户手动点击右侧目录项时，浏览器地址栏的 Hash 自动更新为对应的标题 ID（如 `/article/vue2-vue3#event-cache`）。
* **首屏与回退定位**：他人打开带 Hash 的链接，或者用户在当前页面点击浏览器前进/后退时，页面需自动平滑滚动定位到该标题。
* **滚动性能与体验**：正常滚动页面导致目录激活项变化时，不更新 Hash 以免污染浏览器历史。

## 2. 方案选择：方案 2（单数据源驱动）
利用 React Router 提供的 `useLocation` 作为单数据源，所有滚动定位行为均由监听 `location.hash` 来响应。

## 3. 详细设计

### 3.1 目录组件 `ArticleToc.jsx` 改动
* 引入 `react-router-dom` 的 `useNavigate`。
* 点击目录项时，执行以下操作：
  ```javascript
  const navigate = useNavigate();
  // ...
  const handleTocClick = (id) => {
    navigate({ hash: `#${id}` });
  };
  ```
* 移去原有的直接操作 DOM 的 `scrollIntoView` 定位行为，统一交由路由监听来处理。

### 3.2 文章页面组件 `Article.jsx` 改动
* 引入 `useLocation`。
* 添加滚动定位方法：
  ```javascript
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    
    // 延迟一小段时间，确保 Markdown 的 DOM 已经挂载完全并完成渲染
    const timer = setTimeout(() => {
      try {
        const id = decodeURIComponent(location.hash.slice(1));
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (e) {
        console.error('Failed to scroll to hash anchor:', e);
      }
    }, 150); // 150ms 缓冲时间

    return () => clearTimeout(timer);
  }, [location.hash, articleData]); // 监听 hash 的变化，以及文章数据 (确保数据加载完成后也能定位)
  ```

### 3.3 边界情况与防御性设计
1. **Hash 解码**：由于标题可能包含中文或特殊字符，在生成 ID 时会进行转义，因此在获取 ID 时需要使用 `decodeURIComponent` 解码。
2. **定位延迟**：首次进入页面时，Markdown 转换和 DOM 树的挂载是异步完成的，立即调用定位可能会因为 DOM 未生成而失败。因此加入 `150ms` 延迟，确保在数据 `articleData` 加载后并且 DOM 挂载后执行。
3. **后退支持**：监听 `location.hash` 即可天然在用户点击浏览器后退时获取旧 Hash 并自动滚动。
