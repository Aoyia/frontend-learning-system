import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

// 各境界的彩虹色彩配置
const REALM_CONFIG = {
  '启灵': { rings: 1, color: '#ff4757', colorAlt: '#ff6b81', speed: 1, pulseCount: 0 },
  '炼气': { rings: 2, color: '#ff7f50', colorAlt: '#ffa502', speed: 1.4, pulseCount: 0 },
  '筑基': { rings: 3, color: '#f1c40f', colorAlt: '#f39c12', speed: 1.8, pulseCount: 0 },
  '结丹': { rings: 3, color: '#2ecc71', colorAlt: '#1abc9c', speed: 2.5, pulseCount: 0, hasDan: true },
  '元婴': { rings: 3, color: '#3498db', colorAlt: '#54a0ff', speed: 3.2, pulseCount: 3, hasDan: true },
  '化神': { rings: 3, color: '#9b59b6', colorAlt: '#a55eea', speed: 5, pulseCount: 5, hasDan: true, hasParticles: true },
};

export function PetPedestal({ realm }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animCtxRef = useRef({ tls: [], rafs: [] });
  const cfg = REALM_CONFIG[realm] || REALM_CONFIG['启灵'];

  useEffect(() => {
    const ctx = animCtxRef.current;
    // 清理上一次所有动画
    ctx.tls.forEach(tl => tl.kill());
    ctx.rafs.forEach(id => cancelAnimationFrame(id));
    ctx.tls = [];
    ctx.rafs = [];

    if (!containerRef.current) return;
    const el = containerRef.current;

    // ── 1. 各境界都有：SVG 圆环自旋 ──────────────────────────
    const rings = el.querySelectorAll('.ped-ring');
    rings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 360 : -360;
      const dur = (8 - i * 1.5) / cfg.speed;
      const tl = gsap.to(ring, {
        rotation: dir,
        duration: dur,
        ease: 'none',
        repeat: -1,
        transformOrigin: '50% 50%',
      });
      ctx.tls.push(tl);
    });

    // ── 2. 结丹+：金丹绕轨 ──────────────────────────────────
    if (cfg.hasDan) {
      const dan = el.querySelector('.ped-dan');
      if (dan) {
        const orbitPath = el.querySelector('.ped-orbit-path');
        const tl = gsap.to(dan, {
          motionPath: {
            path: orbitPath,
            align: orbitPath,
            alignOrigin: [0.5, 0.5],
            autoRotate: false,
          },
          duration: 3 / cfg.speed,
          ease: 'none',
          repeat: -1,
        });
        // 金丹自身的呼吸脉冲
        const pulse = gsap.to(dan, {
          scale: 1.5,
          opacity: 0.5,
          duration: 0.6,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        });
        ctx.tls.push(tl, pulse);
      }
    }

    // ── 3. 元婴+：脉冲涟漪圈 ──────────────────────────────
    if (cfg.pulseCount > 0) {
      const pulses = el.querySelectorAll('.ped-pulse-wave');
      pulses.forEach((pw, i) => {
        const tl = gsap.fromTo(pw,
          { scale: 0.3, opacity: 0.9 },
          {
            scale: 2.5,
            opacity: 0,
            duration: 1.8 / cfg.speed * 2,
            ease: 'power2.out',
            repeat: -1,
            delay: i * (1.8 / cfg.pulseCount),
          }
        );
        ctx.tls.push(tl);
      });
    }

    // ── 4. 化神：Canvas 粒子升腾 ──────────────────────────
    if (cfg.hasParticles && canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 240 * dpr;
      canvas.height = 260 * dpr;
      const ctx2d = canvas.getContext('2d');
      ctx2d.scale(dpr, dpr);

      const W = 240, H = 260;
      const colors = [cfg.color, cfg.colorAlt, '#ffffff', '#e0b0ff', '#c8a0ff'];

      const particles = Array.from({ length: 40 }, (_, i) => ({
        x: W / 2 + (Math.random() - 0.5) * 80,
        y: H - 20 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(0.6 + Math.random() * 1.8),
        radius: 1.5 + Math.random() * 2.5,
        alpha: 0,
        life: Math.random(),       // 0~1 当前生命进度
        speed: 0.004 + Math.random() * 0.006,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
      }));

      function drawFrame() {
        ctx2d.clearRect(0, 0, W, H);
        particles.forEach(p => {
          p.life += p.speed;
          if (p.life >= 1) {
            // 重置粒子
            p.x = W / 2 + (Math.random() - 0.5) * 80;
            p.y = H - 10 + Math.random() * 15;
            p.vx = (Math.random() - 0.5) * 1.2;
            p.vy = -(0.6 + Math.random() * 1.8);
            p.life = 0;
            p.color = colors[Math.floor(Math.random() * colors.length)];
          }

          const t = p.life;
          // 透明度：先升后降
          p.alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;

          p.wobble += 0.05;
          const curX = p.x + Math.sin(p.wobble) * 4;
          const curY = p.y + p.vy * t * 160;

          ctx2d.beginPath();
          ctx2d.arc(curX, curY, p.radius * (1 - t * 0.5), 0, Math.PI * 2);
          ctx2d.fillStyle = p.color;
          ctx2d.globalAlpha = p.alpha * 0.85;

          // 外发光
          ctx2d.shadowBlur = 8;
          ctx2d.shadowColor = p.color;
          ctx2d.fill();
          ctx2d.shadowBlur = 0;
          ctx2d.globalAlpha = 1;
        });

        const rafId = requestAnimationFrame(drawFrame);
        ctx.rafs.push(rafId);
      }

      const rafId = requestAnimationFrame(drawFrame);
      ctx.rafs.push(rafId);
    }

    // ── 整体底座入场动画 ──────────────────────────────────
    const enterTl = gsap.fromTo(el,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.3 }
    );
    ctx.tls.push(enterTl);

    return () => {
      ctx.tls.forEach(tl => tl.kill());
      ctx.rafs.forEach(id => cancelAnimationFrame(id));
    };
  }, [realm]);

  const rings = cfg.rings;
  const ringData = [
    { size: 180, dash: '5 4', opacity: 0.9 },
    { size: 140, dash: '0',   opacity: 0.7 },
    { size: 100, dash: '3 6', opacity: 0.5 },
  ].slice(0, rings);

  // 金丹绕轨的椭圆轨道 SVG path（扁平透视效果）
  const orbitRx = 85, orbitRy = 22;
  const orbitPath = `M ${120 - orbitRx} 20 a ${orbitRx} ${orbitRy} 0 1 0 ${orbitRx * 2} 0 a ${orbitRx} ${orbitRy} 0 1 0 -${orbitRx * 2} 0`;

  return (
    <div
      ref={containerRef}
      className="pet-pedestal-gsap"
      style={{ '--realm-col': cfg.color, '--realm-col-alt': cfg.colorAlt }}
    >
      {/* 化神粒子 Canvas */}
      {cfg.hasParticles && (
        <canvas
          ref={canvasRef}
          className="ped-particle-canvas"
          style={{ width: 240, height: 260 }}
        />
      )}

      {/* 元婴脉冲涟漪波 */}
      {cfg.pulseCount > 0 && Array.from({ length: cfg.pulseCount }).map((_, i) => (
        <div key={i} className="ped-pulse-wave" />
      ))}

      {/* 透视法碟 SVG */}
      <svg
        viewBox="0 0 240 60"
        className="ped-svg"
        style={{ overflow: 'visible' }}
      >
        {/* 底板光晕 */}
        <ellipse cx="120" cy="30" rx="85" ry="22"
          fill={`${cfg.color}14`}
          stroke={cfg.color}
          strokeWidth="0.5"
          opacity="0.5"
        />

        {/* 各层同心环 */}
        {ringData.map((r, i) => (
          <ellipse
            key={i}
            className="ped-ring"
            cx="120"
            cy="30"
            rx={r.size / 2}
            ry={r.size / 2 * 0.26}
            fill="none"
            stroke={i === 0 ? cfg.color : cfg.colorAlt}
            strokeWidth={i === 0 ? 1.5 : 1}
            strokeDasharray={r.dash}
            opacity={r.opacity}
            style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }}
          />
        ))}

        {/* 结丹：金丹绕轨路径（隐形轨道 + 金丹球） */}
        {cfg.hasDan && (
          <>
            <path
              className="ped-orbit-path"
              d={orbitPath}
              fill="none"
              stroke="none"
            />
            <circle
              className="ped-dan"
              r="5"
              fill={cfg.color}
              style={{
                filter: `drop-shadow(0 0 6px ${cfg.color}) drop-shadow(0 0 12px ${cfg.colorAlt})`,
              }}
            />
          </>
        )}

        {/* 法阵内核：中央聚光 */}
        <ellipse cx="120" cy="30" rx="18" ry="5"
          fill={`url(#ped-core-grad-${realm})`}
          opacity="0.7"
        />
        <defs>
          <radialGradient id={`ped-core-grad-${realm}`}>
            <stop offset="0%" stopColor={cfg.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={cfg.color} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
