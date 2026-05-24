import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// ── 六大境界配置（彩虹色谱）──────────────────────────────
const REALM_CFG = {
  '启灵': {
    color: '#ff4757', alt: '#ff6b81',
    glowR: 85,
    rays: 0,
    beams: 0,
    particles: 0,
    pulses: 0,
    lightning: false,
    intensity: 0.38,
  },
  '炼气': {
    color: '#ff7f50', alt: '#ffa502',
    glowR: 105,
    rays: 8,
    beams: 0,
    particles: 10,
    pulses: 0,
    lightning: false,
    intensity: 0.52,
  },
  '筑基': {
    color: '#f1c40f', alt: '#f39c12',
    glowR: 125,
    rays: 12,
    beams: 6,
    particles: 22,
    pulses: 0,
    lightning: false,
    intensity: 0.66,
  },
  '结丹': {
    color: '#2ecc71', alt: '#1abc9c',
    glowR: 145,
    rays: 16,
    beams: 8,
    particles: 34,
    pulses: 0,
    lightning: false,
    intensity: 0.78,
  },
  '元婴': {
    color: '#3498db', alt: '#54a0ff',
    glowR: 162,
    rays: 20,
    beams: 10,
    particles: 50,
    pulses: 3,
    lightning: false,
    intensity: 0.88,
  },
  '化神': {
    color: '#9b59b6', alt: '#e056fd',
    glowR: 185,
    rays: 24,
    beams: 12,
    particles: 72,
    pulses: 4,
    lightning: true,
    intensity: 1.0,
  },
};

function hexRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function buildParticles(count, glowR) {
  return Array.from({ length: count }, (_, i) => {
    // 分布在 2 条轨道
    const track = i % 2 === 0 ? 0.55 : 0.80;
    const orbitR = glowR * track + (Math.random() - 0.5) * 12;
    return {
      angle: (Math.PI * 2 * i) / count + Math.random() * 0.8,
      orbitR,
      speed: (0.0025 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1),
      size:  1.2 + Math.random() * 2.8,
      alpha: 0.4 + Math.random() * 0.6,
      mix:   Math.random(),  // 主色 / 辅色插值
      phase: Math.random() * Math.PI * 2,
    };
  });
}

function buildBeams(count, glowR) {
  return Array.from({ length: count }, (_, i) => ({
    angle: (Math.PI * 2 * i) / count,
    len:   glowR * (0.72 + Math.random() * 0.3),
    width: 1.5 + Math.random() * 2,
    alpha: 0.18 + Math.random() * 0.22,
    speed: (0.003 + Math.random() * 0.003) * (i % 2 === 0 ? 1 : -1),
  }));
}

function buildPulses(count) {
  return Array.from({ length: count }, (_, i) => ({
    scale: i / count,      // 错开相位
    alpha: 1 - i / count,
    speed: 0.006,
  }));
}

export function PetAuraBg({ realm }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ raf: null, tl: null });

  useEffect(() => {
    const s = stateRef.current;
    if (s.raf) cancelAnimationFrame(s.raf);
    if (s.tl)  s.tl.kill();

    const cfg = REALM_CFG[realm] ?? REALM_CFG['启灵'];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const SIZE = 340;
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const CX = SIZE / 2, CY = SIZE / 2;
    const [r1, g1, b1] = hexRgb(cfg.color);
    const [r2, g2, b2] = hexRgb(cfg.alt);
    const ity = cfg.intensity;

    // ── 初始化对象池 ─────────────────────────────────────────
    const particles = buildParticles(cfg.particles, cfg.glowR);
    const beams     = buildBeams(cfg.beams, cfg.glowR);
    const pulses    = buildPulses(cfg.pulses);
    let   lightnings = [];
    let   ltTimer    = 0;
    let   frame      = 0;

    function spawnLightning() {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const a0 = Math.random() * Math.PI * 2;
        const r0 = cfg.glowR * (0.5 + Math.random() * 0.45);
        const pts = [[CX + Math.cos(a0) * r0, CY + Math.sin(a0) * r0]];
        let [px, py] = pts[0];
        const steps = 4 + Math.floor(Math.random() * 5);
        for (let s = 0; s < steps; s++) {
          px += (Math.random() - 0.5) * 38;
          py += (Math.random() - 0.5) * 38 - 6;
          pts.push([px, py]);
        }
        lightnings.push({ pts, alpha: 1.0 });
      }
    }

    // ── 主绘制循环 ───────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      frame++;

      // 1. 底部辉光大圆
      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, cfg.glowR);
      bg.addColorStop(0,    `rgba(${r1},${g1},${b1},${0.26 * ity})`);
      bg.addColorStop(0.35, `rgba(${r1},${g1},${b1},${0.14 * ity})`);
      bg.addColorStop(0.65, `rgba(${r2},${g2},${b2},${0.07 * ity})`);
      bg.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, cfg.glowR, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();

      // 2. 放射光芒（炼气起）
      if (cfg.rays > 0) {
        const baseAngle = frame * 0.004;
        for (let i = 0; i < cfg.rays; i++) {
          const a    = (Math.PI * 2 * i) / cfg.rays + baseAngle;
          const len  = cfg.glowR * (0.82 + 0.18 * Math.sin(frame * 0.025 + i * 1.3));
          const half = Math.PI / cfg.rays * 0.38;

          const gr = ctx.createLinearGradient(
            CX, CY,
            CX + Math.cos(a) * len,
            CY + Math.sin(a) * len
          );
          gr.addColorStop(0,   `rgba(${r1},${g1},${b1},${0.22 * ity})`);
          gr.addColorStop(0.5, `rgba(${r2},${g2},${b2},${0.09 * ity})`);
          gr.addColorStop(1,   'rgba(0,0,0,0)');

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(CX, CY);
          ctx.arc(CX, CY, len, a - half, a + half);
          ctx.closePath();
          ctx.fillStyle = gr;
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. 旋转光柱（筑基起）
      beams.forEach(bm => {
        bm.angle += bm.speed;
        const ex = CX + Math.cos(bm.angle) * bm.len;
        const ey = CY + Math.sin(bm.angle) * bm.len;
        const gr = ctx.createLinearGradient(CX, CY, ex, ey);
        gr.addColorStop(0,   `rgba(${r1},${g1},${b1},${bm.alpha * ity * 1.3})`);
        gr.addColorStop(0.55,`rgba(${r2},${g2},${b2},${bm.alpha * ity * 0.55})`);
        gr.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.save();
        ctx.lineWidth   = bm.width;
        ctx.strokeStyle = gr;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = cfg.color;
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // 4. 轨道粒子（筑基起）
      particles.forEach(p => {
        p.angle += p.speed;
        const px = CX + Math.cos(p.angle) * p.orbitR;
        const py = CY + Math.sin(p.angle) * p.orbitR;
        const mr = Math.round(r1 + (r2 - r1) * p.mix);
        const mg = Math.round(g1 + (g2 - g1) * p.mix);
        const mb = Math.round(b1 + (b2 - b1) * p.mix);
        const a  = p.alpha * (0.55 + 0.45 * Math.sin(frame * 0.045 + p.phase));
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle  = `rgba(${mr},${mg},${mb},${a})`;
        ctx.shadowBlur = p.size * 4.5;
        ctx.shadowColor= `rgba(${mr},${mg},${mb},0.85)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. 脉冲涟漪圈（元婴起）
      pulses.forEach(pw => {
        pw.scale += pw.speed;
        pw.alpha -= pw.speed * 0.5;
        if (pw.scale >= 1) { pw.scale = 0; pw.alpha = 0.9; }
        const r = cfg.glowR * pw.scale;
        ctx.beginPath();
        ctx.ellipse(CX, CY, r, r * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r1},${g1},${b1},${pw.alpha * ity})`;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = cfg.color;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      });

      // 6. 天雷闪电（化神专属）
      if (cfg.lightning) {
        ltTimer++;
        if (ltTimer > 50 + Math.random() * 80) {
          spawnLightning();
          ltTimer = 0;
        }
        lightnings.forEach(lt => {
          ctx.save();
          ctx.strokeStyle = `rgba(${r2},${g2},${b2},${lt.alpha})`;
          ctx.lineWidth   = 1.5;
          ctx.shadowBlur  = 18;
          ctx.shadowColor = cfg.alt;
          ctx.beginPath();
          lt.pts.forEach(([x, y], j) => j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();
          lt.alpha -= 0.045;
        });
        lightnings = lightnings.filter(lt => lt.alpha > 0);
      }

      // 7. 核心白光（宠物正后方最亮点）
      const core = ctx.createRadialGradient(CX, CY, 0, CX, CY, 65);
      core.addColorStop(0,   `rgba(255,255,255,${0.28 * ity})`);
      core.addColorStop(0.35,`rgba(${r1},${g1},${b1},${0.22 * ity})`);
      core.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, 65, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      s.raf = requestAnimationFrame(draw);
    }

    if (cfg.lightning) spawnLightning();
    s.raf = requestAnimationFrame(draw);

    // GSAP 入场动画
    s.tl = gsap.fromTo(canvas,
      { opacity: 0, scale: 0.65 },
      { opacity: 1, scale: 1, duration: 0.75, ease: 'back.out(1.5)' }
    );

    return () => {
      cancelAnimationFrame(s.raf);
      if (s.tl) s.tl.kill();
    };
  }, [realm]);

  return (
    <canvas
      ref={canvasRef}
      className="pet-aura-bg-canvas"
      style={{ width: 360, height: 360 }}
      aria-hidden="true"
    />
  );
}
