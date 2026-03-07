"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Mood {
  label: string;
  color: string;
  emoji: string;
  message: string;
}

interface SystemVitalsProps {
  currentMood: Mood;
  onLaunch: () => void;
  isLaunching: boolean;
}

// ─── MINI SPARKLINE CANVAS ────────────────────────────────────────────────────
// Draws a live scrolling waveform that reacts to mood
// Fixed number of history points — independent of canvas pixel width.
// This means x-spacing = W / (HISTORY - 1), which is always stable.
const HISTORY = 120;

const Sparkline = ({ color, moodLabel }: { color: string; moodLabel: string }) => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const tRef       = useRef(0);
  const colorRef   = useRef(color);
  const moodRef    = useRef(moodLabel);
  // Pre-filled ring buffer of exactly HISTORY points — size never changes
  const historyRef = useRef<number[]>(Array(HISTORY).fill(0.5));

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { moodRef.current  = moodLabel; }, [moodLabel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track canvas size separately so we only resize when it actually changes,
    // not every single frame (which would thrash the GPU).
    let W = 0, H = 0;

    const draw = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (!cw || !ch) { rafRef.current = requestAnimationFrame(draw); return; }

      // Only pay the resize cost when dimensions actually change
      if (cw !== W || ch !== H) {
        W = canvas.width  = cw;
        H = canvas.height = ch;
      }

      tRef.current += 1;
      const t = tRef.current;
      const m = moodRef.current;
      const c = colorRef.current;

      // ── Next sample from mood physics ──
      let sample: number;
      switch (m) {
        case 'OPTIMAL':
          sample = 0.5 + Math.sin(t * 0.06) * 0.22 + Math.sin(t * 0.11) * 0.09;
          break;
        case 'ANXIOUS':
          sample = 0.5 + Math.sin(t * 0.22) * 0.28 + (Math.random() - 0.5) * 0.22;
          break;
        case 'LOW POWER':
          sample = 0.3 + Math.sin(t * 0.015) * 0.07;
          break;
        case 'CRITICAL':
          sample = 0.5 + Math.sin(t * 0.38) * 0.36 + (Math.random() - 0.5) * 0.18;
          break;
        case 'MISSING_ADMIN':
          sample = 0.5 + Math.sin(t * 0.05) * 0.14 + Math.sin(t * 0.17) * 0.18;
          break;
        default:
          sample = 0.5;
      }
      sample = Math.max(0.04, Math.min(0.96, sample));

      // Shift ring buffer left, append new sample at the right
      historyRef.current.shift();
      historyRef.current.push(sample);

      ctx.clearRect(0, 0, W, H);

      const pts = historyRef.current;
      const N   = pts.length; // always HISTORY

      // ── Helper: x/y for index i ──
      const px = (i: number) => (i / (N - 1)) * W;
      const py = (v: number) => H - v * H;

      // ── Filled area ──
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `${c}28`);
      grad.addColorStop(1, `${c}00`);

      ctx.beginPath();
      ctx.moveTo(px(0), py(pts[0]));
      for (let i = 1; i < N; i++) ctx.lineTo(px(i), py(pts[i]));
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Line ──
      ctx.beginPath();
      ctx.moveTo(px(0), py(pts[0]));
      for (let i = 1; i < N; i++) ctx.lineTo(px(i), py(pts[i]));
      ctx.strokeStyle = c;
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      ctx.shadowColor = c;
      ctx.shadowBlur  = 4;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // ── Live edge dot ──
      const lastV = pts[N - 1];
      ctx.beginPath();
      ctx.arc(W - 2, py(lastV), 2.5, 0, Math.PI * 2);
      ctx.fillStyle   = c;
      ctx.shadowColor = c;
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.shadowBlur  = 0;

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

// ─── ANIMATED READOUT ROW ─────────────────────────────────────────────────────
const ReadoutRow = ({
  label, value, unit, color, showBar = false, barValue = 0,
}: {
  label: string; value: string; unit?: string; color: string;
  showBar?: boolean; barValue?: number;
}) => (
  <div className="flex flex-col gap-[3px]">
    <div className="flex items-center justify-between">
      <span className="font-mono text-[7px] tracking-[0.3em] uppercase text-white/30">{label}</span>
      <span className="font-mono text-[9px] font-bold tabular-nums" style={{ color, textShadow: `0 0 8px ${color}80` }}>
        {value}<span className="text-[7px] opacity-60 ml-0.5">{unit}</span>
      </span>
    </div>
    {showBar && (
      <div className="h-[2px] w-full rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${barValue * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    )}
  </div>
);

// ─── AFFECTION CAPACITY RING ──────────────────────────────────────────────────
const AffectionRing = ({ color }: { color: string }) => {
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setOverflow(v => !v), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex items-center justify-center w-[52px] h-[52px] shrink-0">
      {/* Outer pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${color}` }}
      />
      {/* SVG arc ring */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 52 52">
        {/* Track */}
        <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        {/* Fill — 99.9% means nearly full circle */}
        <motion.circle
          cx="26" cy="26" r="20"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 20}`}
          animate={{ strokeDashoffset: 2 * Math.PI * 20 * 0.001 }} // 99.9% filled
          initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
          style={{
            transformOrigin: '26px 26px',
            transform: 'rotate(-90deg)',
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      </svg>
      {/* Center label */}
      <div className="relative z-10 flex flex-col items-center leading-none">
        <AnimatePresence mode="wait">
          {overflow ? (
            <motion.span
              key="overflow"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="font-mono text-[7px] font-black tracking-tight"
              style={{ color }}
            >OVF</motion.span>
          ) : (
            <motion.span
              key="pct"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[8px] font-black tabular-nums"
              style={{ color, textShadow: `0 0 8px ${color}` }}
            >99.9%</motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── SUPERNOVA LAUNCH SWITCH ──────────────────────────────────────────────────
const SupernovaLaunchSwitch = ({ onLaunch, isLaunching }: { onLaunch: () => void; isLaunching: boolean }) => {
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  return (
    <div className="w-full relative h-[62px] flex items-end justify-center" style={{ perspective: '800px' }}>
      {/* Button base housing */}
      <div className="absolute bottom-0 w-full h-[44px] bg-[#0a0a0a] rounded-md border border-[#1e1e1e]
                      shadow-[inset_0_4px_12px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <button
          onClick={() => { if (isCoverOpen && !isLaunching) { onLaunch(); setTimeout(() => setIsCoverOpen(false), 3000); } }}
          className={`relative w-[88%] h-[30px] rounded-[3px] transition-all duration-75 flex items-center justify-center gap-2
            ${isCoverOpen
              ? 'bg-gradient-to-b from-[var(--accent)] to-[#991b1b] shadow-[0_0_20px_var(--accent),inset_0_2px_4px_rgba(255,255,255,0.35),0_3px_0_#450a0a] cursor-pointer'
              : 'bg-[#150303] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8),0_2px_0_#000] cursor-default'}`}
        >
          {isCoverOpen && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_white]"
            />
          )}
          <span className={`font-mono text-[9px] font-black tracking-[0.35em] transition-colors duration-300
            ${isCoverOpen ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : 'text-[#3a0808]'}`}>
            {isLaunching ? 'TRANSMITTING' : 'EXECUTE'}
          </span>
        </button>
      </div>

      {/* Flip cover */}
      <motion.div
        initial={false}
        animate={{ rotateX: isCoverOpen ? 115 : 0 }}
        transition={{ type: 'spring', stiffness: 130, damping: 16 }}
        onClick={() => !isLaunching && setIsCoverOpen(v => !v)}
        style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
        className={`absolute top-[16px] w-[97%] h-[46px] z-20 cursor-pointer rounded-sm
          border-[1.5px] border-red-500/35 flex items-center justify-center group will-change-transform
          ${isCoverOpen
            ? 'bg-red-900/20 shadow-[0_-4px_16px_rgba(239,68,68,0.15)]'
            : 'bg-red-600/15 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.9),inset_0_1px_4px_rgba(255,255,255,0.15)] hover:bg-red-500/25'}`}
      >
        <div className="absolute -top-[2px] w-10 h-1.5 bg-black rounded-sm shadow-[0_1px_0_rgba(255,255,255,0.15)]" />
        <span className={`font-mono text-[7px] tracking-[0.45em] font-bold mt-2 transition-opacity duration-200
          ${isCoverOpen ? 'opacity-0' : 'text-white/50 group-hover:text-white/90'}`}>
          LIFT TO ARM
        </span>
      </motion.div>
    </div>
  );
};

// ─── UPTIME CLOCK ─────────────────────────────────────────────────────────────
const START_DATE = new Date('2023-01-01');

const UptimeClock = ({ color }: { color: string }) => {
  const [elapsed, setElapsed] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Date.now() - START_DATE.getTime();
      const s = Math.floor(diff / 1000);
      setElapsed({ d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-end gap-[3px]">
      {[{ v: elapsed.d, u: 'd' }, { v: elapsed.h, u: 'h' }, { v: elapsed.m, u: 'm' }, { v: elapsed.s, u: 's' }].map(({ v, u }) => (
        <div key={u} className="flex items-end gap-[1px]">
          <span className="font-mono text-[11px] font-black tabular-nums leading-none"
            style={{ color, textShadow: `0 0 8px ${color}80` }}>
            {String(v).padStart(u === 'd' ? 1 : 2, '0')}
          </span>
          <span className="font-mono text-[6px] text-white/30 mb-[1px]">{u}</span>
        </div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function SystemVitals({ currentMood, onLaunch, isLaunching }: SystemVitalsProps) {
  const c = currentMood.color;

  // Mood-derived vitals
  const vitals = {
    OPTIMAL:       { signal: '98.4', temp: '36.2°', sync: '12ms', integrity: 0.98 },
    ANXIOUS:       { signal: '71.2', temp: '38.9°', sync: '340ms', integrity: 0.71 },
    'LOW POWER':   { signal: '34.0', temp: '35.1°', sync: '1.2s',  integrity: 0.34 },
    CRITICAL:      { signal: '88.7', temp: '41.3°', sync: '8ms',   integrity: 0.88 },
    MISSING_ADMIN: { signal: '52.1', temp: '36.8°', sync: '890ms', integrity: 0.52 },
  }[currentMood.label] ?? { signal: '—', temp: '—', sync: '—', integrity: 0.5 };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden rounded-[inherit] relative"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #070707 100%)' }}>

      {/* Noise texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 1px,#000 1px,#000 2px)' }} />

      {/* ── Header ── */}
      <div className="shrink-0 relative z-10 px-4 pt-3 pb-2 border-b flex items-center justify-between"
        style={{ borderColor: `${c}18` }}>
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
          <span className="font-mono text-[7px] tracking-[0.4em] text-white/35 uppercase">System_Vitals</span>
        </div>
        <UptimeClock color={c} />
      </div>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-0 z-10 relative overflow-hidden">

        {/* Sparkline strip */}
        <div className="shrink-0 h-[36px] w-full border-b" style={{ borderColor: `${c}10` }}>
          <Sparkline color={c} moodLabel={currentMood.label} />
        </div>

        {/* Readout grid + affection ring */}
        <div className="shrink-0 flex items-start gap-3 px-4 pt-3 pb-2">
          {/* Readouts */}
          <div className="flex-1 flex flex-col gap-2">
            <ReadoutRow label="Signal_Str"   value={vitals.signal}    unit="%"   color={c} showBar barValue={parseFloat(vitals.signal) / 100} />
            <ReadoutRow label="Core_Temp"    value={vitals.temp}               color={c} />
            <ReadoutRow label="Link_Latency" value={vitals.sync}               color={c} />
          </div>
          {/* Affection ring */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <AffectionRing color={c} />
            <span className="font-mono text-[6px] tracking-[0.2em] uppercase text-white/25">Affection</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 shrink-0 h-px" style={{ backgroundColor: `${c}12` }} />

        {/* Launch switch */}
        <div className="shrink-0 px-4 pt-2 pb-3">
          <div className="font-mono text-[6px] tracking-[0.4em] text-white/20 uppercase mb-2">
            Hug_Transmitter // Arm &amp; Execute
          </div>
          <SupernovaLaunchSwitch onLaunch={onLaunch} isLaunching={isLaunching} />
        </div>
      </div>
    </div>
  );
}