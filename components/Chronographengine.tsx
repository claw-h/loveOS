"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const START_DATE = new Date("2023-01-01");

interface OrreryProps {
  days: number;
  mood: { label: string; color: string };
  elapsed: { d: number; h: number; m: number; s: number };
}

// ─── CANVAS ORRERY ────────────────────────────────────────────────────────────
const OrreryCanvas = ({ days, mood, elapsed }: OrreryProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const hoveredNotchRef = useRef<{ ring: number; index: number; label: string; x: number; y: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

  const totalWeeks = Math.floor(days / 7);
  const totalMonths = Math.floor(days / 30.44);

  const getColor = useCallback(() => mood.color, [mood.color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      timeRef.current += 0.004;
      const t = timeRef.current;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const baseR = Math.min(W, H) * 0.38;
      const accentColor = getColor();

      // ── Ambient fog ──
      const fog = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 1.6);
      fog.addColorStop(0, `${accentColor}08`);
      fog.addColorStop(0.5, `${accentColor}04`);
      fog.addColorStop(1, 'transparent');
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);

      // ── Grid cross-hairs ──
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Ring definitions: [radius multiplier, total notches, filled notches, speed, label]
      const rings: [number, number, number, number, string][] = [
        [0.38, 365, days % 365, 0.0008, 'DAYS'],
        [0.58, 52,  totalWeeks % 52, 0.0005, 'WEEKS'],
        [0.78, 12,  totalMonths % 12, 0.0002, 'MONTHS'],
      ];

      hoveredNotchRef.current = null;

      rings.forEach(([rMul, total, filled, speed, label], ringIdx) => {
        const r = baseR * (rMul / 0.38);
        const rotOffset = t * speed * Math.PI * 2;

        // ── Ring track ──
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,0.06)`;
        ctx.lineWidth = ringIdx === 0 ? 28 : ringIdx === 1 ? 22 : 18;
        ctx.stroke();
        ctx.restore();

        // ── Ring glow track ──
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `${accentColor}10`;
        ctx.lineWidth = ringIdx === 0 ? 32 : ringIdx === 1 ? 26 : 22;
        ctx.stroke();
        ctx.restore();

        // ── Notches ──
        for (let i = 0; i < total; i++) {
          const angle = (i / total) * Math.PI * 2 - Math.PI / 2 + rotOffset;
          const isFilled = i < filled;
          const isEdge = i === filled - 1;

          const nx = cx + Math.cos(angle) * r;
          const ny = cy + Math.sin(angle) * r;

          const notchSize = ringIdx === 0 ? 2.5 : ringIdx === 1 ? 3.5 : 5;

          // Filled notch glow pulse for edge notch
          if (isEdge) {
            const pulse = (Math.sin(t * 4) + 1) / 2;
            ctx.beginPath();
            ctx.arc(nx, ny, notchSize * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `${accentColor}${Math.floor(pulse * 60).toString(16).padStart(2, '0')}`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(nx, ny, notchSize, 0, Math.PI * 2);

          if (isFilled) {
            // Scar glow
            const scarGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, notchSize * 2);
            scarGrad.addColorStop(0, accentColor);
            scarGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = isEdge ? '#ffffff' : accentColor;
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = isEdge ? 12 : 4;
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.shadowBlur = 0;
          }
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // ── Ring label ──
        ctx.save();
        ctx.font = `bold 8px monospace`;
        ctx.fillStyle = `${accentColor}80`;
        ctx.letterSpacing = '0.3em';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelAngle = -Math.PI / 2 + rotOffset;
        const lx = cx + Math.cos(labelAngle) * (r + (ringIdx === 0 ? 24 : ringIdx === 1 ? 20 : 18));
        const ly = cy + Math.sin(labelAngle) * (r + (ringIdx === 0 ? 24 : ringIdx === 1 ? 20 : 18));
        ctx.fillText(label, lx, ly);
        ctx.restore();
      });

      // ── Core pulse ──
      const coreR = baseR * 0.18;
      const corePulse = 1 + Math.sin(t * 2.5) * 0.06;

      // Core outer halo
      const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
      haloGrad.addColorStop(0, `${accentColor}30`);
      haloGrad.addColorStop(0.4, `${accentColor}10`);
      haloGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core body
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * corePulse, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, accentColor);
      coreGrad.addColorStop(1, `${accentColor}40`);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.restore();

      // Core inner dot
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── Spoke lines from center ──
      [0, 1, 2].forEach((ringIdx) => {
        const rMul = [0.38, 0.58, 0.78][ringIdx];
        const r = baseR * (rMul / 0.38);
        const speed = [0.0008, 0.0005, 0.0002][ringIdx];
        const rotOffset = t * speed * Math.PI * 2;
        const angle = -Math.PI / 2 + rotOffset;

        const innerR = ringIdx === 0 ? coreR * 1.1 : baseR * ([0.28, 0.48][ringIdx - 1] / 0.38);
        const outerR = r;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.strokeStyle = `${accentColor}30`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // ── Outer decorative tick marks ──
      const outerR = baseR * (0.78 / 0.38) + 30;
      for (let i = 0; i < 72; i++) {
        const angle = (i / 72) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 6 === 0;
        const len = isMajor ? 10 : 5;
        const x1 = cx + Math.cos(angle) * outerR;
        const y1 = cy + Math.sin(angle) * outerR;
        const x2 = cx + Math.cos(angle) * (outerR + len);
        const y2 = cy + Math.sin(angle) * (outerR + len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isMajor ? `${accentColor}60` : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = isMajor ? 1.5 : 0.5;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [days, totalWeeks, totalMonths, getColor]);

  // ── Mouse hover for notch tooltips ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    const baseR = Math.min(rect.width, rect.height) * 0.38;

    // Check which ring
    const rings = [
      { rMul: 0.38, total: 365, filled: days % 365, label: 'day', unit: 'DAY' },
      { rMul: 0.58, total: 52, filled: Math.floor(days / 7) % 52, label: 'week', unit: 'WEEK' },
      { rMul: 0.78, total: 12, filled: Math.floor(days / 30.44) % 12, label: 'month', unit: 'MONTH' },
    ];

    for (const ring of rings) {
      const r = baseR * (ring.rMul / 0.38);
      if (Math.abs(dist - r) < 20) {
        const angle = Math.atan2(my - cy, mx - cx) + Math.PI / 2;
        const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const index = Math.round((normalized / (Math.PI * 2)) * ring.total) % ring.total;
        if (index < ring.filled) {
          // Compute the actual date for this notch
          let msOffset = 0;
          if (ring.unit === 'DAY') msOffset = index * 86400000;
          else if (ring.unit === 'WEEK') msOffset = index * 7 * 86400000;
          else msOffset = index * 30 * 86400000;
          const d = new Date(START_DATE.getTime() + msOffset);
          const label = `${ring.unit} ${index + 1} — ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
          setTooltip({ label, x: e.clientX - rect.left, y: e.clientY - rect.top - 16 });
          return;
        }
      }
    }
    setTooltip(null);
  }, [days]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute pointer-events-none z-50 px-3 py-2 rounded-md bg-black/80 backdrop-blur-md border border-white/10 font-mono text-[10px] tracking-[0.2em] text-white/80 whitespace-nowrap"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          >
            {tooltip.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── TICKER DIGIT ─────────────────────────────────────────────────────────────
const TickerDigit = ({ value, color }: { value: string; color: string }) => (
  <motion.span
    key={value}
    initial={{ y: -10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 10, opacity: 0 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    className="inline-block font-mono tabular-nums"
    style={{ color }}
  >
    {value}
  </motion.span>
);

const LiveClock = ({ elapsed, color }: { elapsed: { d: number; h: number; m: number; s: number }; color: string }) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const segments = [
    { label: 'DAYS',  value: String(elapsed.d).padStart(4, '0') },
    { label: 'HRS',   value: pad(elapsed.h) },
    { label: 'MIN',   value: pad(elapsed.m) },
    { label: 'SEC',   value: pad(elapsed.s) },
  ];

  return (
    <div className="flex items-end gap-6 justify-center">
      {segments.map((seg, i) => (
        <React.Fragment key={seg.label}>
          <div className="flex flex-col items-center gap-1">
            <div className="flex">
              <AnimatePresence mode="popLayout">
                {seg.value.split('').map((ch, ci) => (
                  <TickerDigit key={`${ci}-${ch}`} value={ch} color={i === 0 ? color : 'rgba(245,245,240,0.7)'} />
                ))}
              </AnimatePresence>
            </div>
            <span className="font-mono text-[7px] tracking-[0.4em] text-white/30 uppercase">{seg.label}</span>
          </div>
          {i < segments.length - 1 && (
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="text-white/30 font-mono text-lg mb-4"
            >:</motion.span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── MISSION STATS BAR ────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
    <span className="font-mono text-[8px] text-white/30 tracking-[0.3em] uppercase">{label}</span>
    <span className="font-mono text-sm font-bold" style={{ color }}>{value}</span>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ChronographEngine({ mood }: { mood?: { label: string; color: string } }) {
  const activeMood = mood ?? { label: 'OPTIMAL', color: '#F59E0B' };

  const [days, setDays] = useState(0);
  const [elapsed, setElapsed] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ms = now.getTime() - START_DATE.getTime();
      const totalSeconds = Math.floor(ms / 1000);
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setDays(d);
      setElapsed({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const totalWeeks  = Math.floor(days / 7);
  const totalMonths = Math.floor(days / 30.44);
  const approxYears = (days / 365.25).toFixed(2);

  return (
    <div className="h-full w-full flex flex-col bg-[#05030A] relative overflow-hidden rounded-[inherit]">

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)' }}
      />

      {/* Ambient vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,#030108_100%)]" />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-8 pt-6 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: activeMood.color, boxShadow: `0 0 8px ${activeMood.color}` }}
          />
          <span className="font-mono text-[9px] tracking-[0.4em] text-white/40 uppercase">Chronograph_Engine // LIVE</span>
        </div>
        <button
          onClick={() => setShowDetail(v => !v)}
          className="font-mono text-[8px] tracking-[0.3em] text-white/30 hover:text-white/60 uppercase transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-md"
        >
          {showDetail ? 'ORRERY VIEW' : 'DETAIL VIEW'}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 relative z-20 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {!showDetail ? (
            <motion.div
              key="orrery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Orrery canvas — takes most of the space */}
              <div className="flex-1 relative min-h-0">
                <OrreryCanvas days={days} mood={activeMood} elapsed={elapsed} />

                {/* Hero days number overlaid at center — offset downward so it sits below orrery */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.div
                    key={days}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-mono font-black tabular-nums select-none"
                    style={{
                      fontSize: 'clamp(3rem, 10vw, 8rem)',
                      color: activeMood.color,
                      textShadow: `0 0 40px ${activeMood.color}60, 0 0 80px ${activeMood.color}20`,
                      lineHeight: 1,
                    }}
                  >
                    {days}
                  </motion.div>
                  <span className="font-mono text-[10px] tracking-[0.6em] text-white/20 uppercase mt-2">DAYS ELAPSED</span>
                </div>
              </div>

              {/* Live ticker */}
              <div className="shrink-0 px-8 pb-4 pt-2 border-t border-white/[0.05]">
                <div className="mb-3 text-center">
                  <span className="font-mono text-[8px] tracking-[0.4em] text-white/20 uppercase">Mission_Elapsed_Time</span>
                </div>
                <LiveClock elapsed={elapsed} color={activeMood.color} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center gap-10 px-10"
            >
              {/* Large elapsed display */}
              <div className="text-center">
                <motion.div
                  className="font-mono font-black tabular-nums"
                  style={{
                    fontSize: 'clamp(4rem, 12vw, 10rem)',
                    color: activeMood.color,
                    textShadow: `0 0 60px ${activeMood.color}50`,
                    lineHeight: 1,
                  }}
                >
                  {days}
                </motion.div>
                <div className="font-mono text-[11px] tracking-[0.8em] text-white/30 uppercase mt-3">Solar Days Online</div>
              </div>

              {/* Live ticker */}
              <div className="w-full border-t border-b border-white/[0.06] py-6">
                <LiveClock elapsed={elapsed} color={activeMood.color} />
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-3 justify-center">
                <StatPill label="Weeks"  value={String(totalWeeks)}  color={activeMood.color} />
                <StatPill label="Months" value={String(totalMonths)} color={activeMood.color} />
                <StatPill label="Years"  value={approxYears}         color={activeMood.color} />
                <StatPill label="Hours"  value={String(elapsed.d * 24 + elapsed.h)} color="rgba(245,245,240,0.6)" />
                <StatPill label="Start"  value="JAN 2023"            color="rgba(245,245,240,0.4)" />
              </div>

              {/* Progress bars for current-cycle completion */}
              <div className="w-full max-w-lg flex flex-col gap-4">
                {[
                  { label: 'Year progress',  pct: ((days % 365) / 365) * 100 },
                  { label: 'Month progress', pct: ((days % 30) / 30) * 100 },
                  { label: 'Week progress',  pct: ((days % 7) / 7) * 100 },
                ].map(({ label, pct }) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="font-mono text-[8px] tracking-widest text-white/30 uppercase w-28 shrink-0">{label}</span>
                    <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: activeMood.color, boxShadow: `0 0 6px ${activeMood.color}` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-white/40 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}