import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TECH_BREAKER_CONTENT } from '../../data/tech-breaker-content.js';
import {
  TECH_BREAKER_LAYOUT_KEY,
  getCanvasBounds,
  getCanvasNodeSummary,
  getCanvasNodeTitle,
  getEdgePoint,
  mergeCanvasNodesWithSavedLayout,
  readSavedCanvasLayout,
} from '../utils/techBreaker.js';

export function TechBreakerMap({ onOpenCard }) {
  const originalNodes = TECH_BREAKER_CONTENT.canvas.nodes;
  const edges = TECH_BREAKER_CONTENT.canvas.edges;
  const savedLayout = useMemo(readSavedCanvasLayout, []);
  const [nodes, setNodes] = useState(() => mergeCanvasNodesWithSavedLayout(originalNodes, savedLayout));
  const [view, setView] = useState(() => savedLayout?.view || { x: 80, y: 80, scale: 0.72 });
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const suppressNodeClickRef = useRef(false);
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map(node => [node.id, node])), [nodes]);
  const bounds = useMemo(() => getCanvasBounds(nodes), [nodes]);
  const svgPad = 420;
  const svgBox = {
    x: bounds.minX - svgPad,
    y: bounds.minY - svgPad,
    width: bounds.width + svgPad * 2,
    height: bounds.height + svgPad * 2,
  };

  function persistLayout(nextNodes = nodes, nextView = view) {
    const compactNodes = Object.fromEntries(
      nextNodes.map(node => [node.id, { x: node.x, y: node.y, width: node.width, height: node.height }])
    );
    window.localStorage.setItem(TECH_BREAKER_LAYOUT_KEY, JSON.stringify({ nodes: compactNodes, view: nextView }));
  }

  function fitView(nextNodes = nodes) {
    const container = viewportRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nextBounds = getCanvasBounds(nextNodes);
    const scale = Math.min(0.9, Math.max(0.22, Math.min(
      (rect.width - 80) / nextBounds.width,
      (rect.height - 80) / nextBounds.height
    )));
    const nextView = {
      scale,
      x: (rect.width - nextBounds.width * scale) / 2 - nextBounds.minX * scale,
      y: (rect.height - nextBounds.height * scale) / 2 - nextBounds.minY * scale,
    };
    setView(nextView);
    persistLayout(nextNodes, nextView);
  }

  useEffect(() => {
    if (!savedLayout?.view) requestAnimationFrame(() => fitView(nodes));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateView(nextView) {
    setView(nextView);
    persistLayout(nodes, nextView);
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const pointX = e.clientX - rect.left;
    const pointY = e.clientY - rect.top;
    const worldX = (pointX - view.x) / view.scale;
    const worldY = (pointY - view.y) / view.scale;
    const nextScale = Math.min(1.6, Math.max(0.18, view.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    updateView({
      scale: nextScale,
      x: pointX - worldX * nextScale,
      y: pointY - worldY * nextScale,
    });
  }

  function startPan(e) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      type: 'pan',
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startView: view,
      moved: false,
    };
  }

  function startNodeDrag(e, node) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      type: 'node',
      pointerId: e.pointerId,
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      startNode: { x: node.x, y: node.y },
      moved: false,
    };
  }

  function onPointerMove(e) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;

    if (drag.type === 'pan') {
      setView({ ...drag.startView, x: drag.startView.x + dx, y: drag.startView.y + dy });
      return;
    }

    if (drag.type === 'node') {
      setNodes(prev => prev.map(node => (
        node.id === drag.nodeId
          ? { ...node, x: drag.startNode.x + dx / view.scale, y: drag.startNode.y + dy / view.scale }
          : node
      )));
    }
  }

  function onPointerUp(e) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.type === 'pan') {
      const dx = e ? e.clientX - drag.startX : 0;
      const dy = e ? e.clientY - drag.startY : 0;
      const nextView = { ...drag.startView, x: drag.startView.x + dx, y: drag.startView.y + dy };
      setView(nextView);
      persistLayout(nodes, nextView);
      return;
    }
    if (drag.moved) {
      suppressNodeClickRef.current = true;
      window.setTimeout(() => { suppressNodeClickRef.current = false; }, 0);
    }
    setNodes(prev => {
      persistLayout(prev, view);
      return prev;
    });
  }

  function resetLayout() {
    window.localStorage.removeItem(TECH_BREAKER_LAYOUT_KEY);
    setNodes(originalNodes);
    requestAnimationFrame(() => fitView(originalNodes));
  }

  return (
    <div data-component="tech-breaker-map" className="h-full min-h-0 flex flex-col relative">
      <div className="absolute top-3.5 left-3.5 right-3.5 z-5 flex items-center justify-between gap-3 pointer-events-none">
        <div className="px-3 py-2 border border-border rounded-lg bg-surface/86 text-text text-[14px] font-bold shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md pointer-events-auto">技术破冰</div>
        <div className="flex gap-2 pointer-events-auto">
          <button className="border border-border rounded-lg bg-surface/86 text-text-secondary px-2.75 py-2 cursor-pointer text-[12px] font-bold backdrop-blur-md transition-all duration-180 shadow-[0_8px_24px_rgba(0,0,0,0.16)] hover:border-primary hover:text-primary" onClick={() => fitView(nodes)} title="适配视图">适配</button>
          <button className="border border-border rounded-lg bg-surface/86 text-text-secondary px-2.75 py-2 cursor-pointer text-[12px] font-bold backdrop-blur-md transition-all duration-180 shadow-[0_8px_24px_rgba(0,0,0,0.16)] hover:border-primary hover:text-primary" onClick={resetLayout} title="重置布局">重置</button>
        </div>
      </div>

      <div
        className="canvas-viewport"
        ref={viewportRef}
        onWheel={onWheel}
        onPointerDown={startPan}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="canvas-world"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <svg
            className="canvas-edges"
            style={{ left: svgBox.x, top: svgBox.y, width: svgBox.width, height: svgBox.height }}
            viewBox={`${svgBox.x} ${svgBox.y} ${svgBox.width} ${svgBox.height}`}
          >
            {edges.map(edge => {
              const from = getEdgePoint(nodeMap[edge.fromNode], edge.fromSide);
              const to = getEdgePoint(nodeMap[edge.toNode], edge.toSide);
              const midX = (from.x + to.x) / 2;
              return (
                <g key={edge.id}>
                  <path
                    d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                    className="canvas-edge"
                  />
                  {edge.label && <text className="canvas-edge-label" x={midX} y={(from.y + to.y) / 2 - 8}>{edge.label}</text>}
                </g>
              );
            })}
          </svg>

          {nodes.map(node => {
            const cardTitle = TECH_BREAKER_CONTENT.nodeToCard[node.id];
            const clickable = node.type === 'file' && cardTitle;
            return (
              <div
                key={node.id}
                className={`canvas-node color-${node.color || '6'} ${node.type} ${clickable ? 'clickable' : ''}`}
                style={{ left: node.x, top: node.y, width: node.width, minHeight: node.height }}
                onPointerDown={(e) => startNodeDrag(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!suppressNodeClickRef.current && clickable) onOpenCard(node.id);
                }}
              >
                <div className="text-[14px] font-bold leading-[1.35]">{getCanvasNodeTitle(node)}</div>
                {node.type === 'text' && getCanvasNodeSummary(node) && (
                  <div className="whitespace-pre-wrap mt-1.75 text-[11px] leading-relaxed text-text-secondary">{getCanvasNodeSummary(node)}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

