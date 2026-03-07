"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// ─── MOOD DEFINITIONS ────────────────────────────────────────────────────────
const MOODS = [
  { label: "OPTIMAL",       color: "#F59E0B", emoji: "✧", message: "All systems nominal.",         intensity: 0.95 },
  { label: "ANXIOUS",       color: "#A78BFA", emoji: "≈", message: "Running background defrag.",   intensity: 0.65 },
  { label: "LOW POWER",     color: "#D4D4D8", emoji: "☾", message: "Battery depleted. Resting.",   intensity: 0.25 },
  { label: "CRITICAL",      color: "#DC2626", emoji: "⚠", message: "Core overheat. Hugs required.", intensity: 0.85 },
  { label: "MISSING_ADMIN", color: "#14B8A6", emoji: "⍙", message: "Searching for connection...",  intensity: 0.5  },
];

type Mood = typeof MOODS[0];

// ─── NEEDLE GAUGE (canvas) ───────────────────────────────────────────────────
const NeedleGauge = ({ value, color }: { value: number; color: string }) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  // These refs let us update targets without restarting the perpetual loop
  const targetRef    = useRef(value);
  const currentVal   = useRef(0);   // smoothly interpolated 0‒1 value (drives needle + %)
  const colorRef     = useRef(color);

  // Keep refs in sync with props — the loop reads from refs, never from closure
  useEffect(() => { targetRef.current = value; }, [value]);
  useEffect(() => { colorRef.current  = color; }, [color]);

  // Start the perpetual draw loop exactly once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width  = canvas.clientWidth;
      const H = canvas.height = canvas.clientHeight;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }

      // ── Smooth interpolation (always running) ──
      currentVal.current += (targetRef.current - currentVal.current) * 0.055;

      const v = currentVal.current;
      const c = colorRef.current;

      // ── Geometry: semi-circular gauge that fits a SHORT WIDE container.
      //    Arc runs from 180° (left) to 0° (right) — a clean half-circle.
      //    Pivot sits at the bottom-center of the canvas.
      //    r is clamped so the arc never exceeds W/2 or H. ──
      const PAD   = 8;
      const cx    = W / 2;
      const cy    = H - PAD;                    // pivot at bottom edge
      const r     = Math.min(W / 2 - PAD, H - PAD * 2);  // fits both axes
      const START = Math.PI;                    // 180° — left stop
      const SWEEP = Math.PI;                    // 180° sweep to 0° — right stop

      ctx.clearRect(0, 0, W, H);

      // ── Track background ──
      ctx.beginPath();
      ctx.arc(cx, cy, r, START, START + SWEEP, false);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 5;
      ctx.lineCap     = 'round';
      ctx.stroke();

      // ── Colored fill arc ──
      if (v > 0.005) {
        const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
        grad.addColorStop(0, `${c}50`);
        grad.addColorStop(1, c);
        ctx.beginPath();
        ctx.arc(cx, cy, r, START, START + v * SWEEP, false);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 5;
        ctx.lineCap     = 'round';
        ctx.shadowColor = c;
        ctx.shadowBlur  = 10;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // ── Tick marks ──
      for (let i = 0; i <= 8; i++) {
        const ta      = START + (i / 8) * SWEEP;
        const isMajor = i === 0 || i === 4 || i === 8;
        const innerR  = r - (isMajor ? 9 : 5);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ta) * innerR, cy + Math.sin(ta) * innerR);
        ctx.lineTo(cx + Math.cos(ta) * (r + 1), cy + Math.sin(ta) * (r + 1));
        ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth   = isMajor ? 1.5 : 0.8;
        ctx.stroke();
      }

      // ── Needle ──
      const needleAngle = START + v * SWEEP;
      const needleLen   = r * 0.85;
      const tailLen     = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(needleAngle) * tailLen, cy - Math.sin(needleAngle) * tailLen);
      ctx.lineTo(cx + Math.cos(needleAngle) * needleLen, cy + Math.sin(needleAngle) * needleLen);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.shadowColor = c;
      ctx.shadowBlur  = 5;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // ── Pivot cap ──
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle   = c;
      ctx.shadowColor = c;
      ctx.shadowBlur  = 8;
      ctx.fill();
      ctx.shadowBlur  = 0;

      // ── % readout — just above pivot, inside the arc bowl ──
      const displayPct = Math.round(v * 100);
      ctx.font         = 'bold 10px monospace';
      ctx.fillStyle    = c;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor  = c;
      ctx.shadowBlur   = 6;
      ctx.fillText(`${displayPct}%`, cx, cy - 10);
      ctx.shadowBlur   = 0;

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // ← empty deps: loop starts once, reads from refs forever

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

// ─── FLIP SWITCH ─────────────────────────────────────────────────────────────
const FlipSwitch = ({ mood, isActive, onClick }: { mood: Mood; isActive: boolean; onClick: () => void }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isActive || isAnimating) return;
    setIsAnimating(true);
    onClick();
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-1.5 group outline-none"
      style={{ cursor: isActive ? 'default' : 'pointer' }}
    >
      {/* Switch housing */}
      <div
        className="relative w-9 rounded-sm border transition-all duration-500"
        style={{
          height: '44px',
          backgroundColor: isActive ? '#0a0a0a' : '#111',
          borderColor: isActive ? mood.color : 'rgba(255,255,255,0.1)',
          boxShadow: isActive
            ? `0 0 12px ${mood.color}40, inset 0 2px 6px rgba(0,0,0,0.8)`
            : 'inset 0 2px 6px rgba(0,0,0,0.8)',
        }}
      >
        {/* Indicator light */}
        <div className="absolute top-[5px] left-1/2 -translate-x-1/2">
          <div
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: isActive ? mood.color : 'rgba(255,255,255,0.1)',
              boxShadow: isActive ? `0 0 6px ${mood.color}, 0 0 12px ${mood.color}60` : 'none',
            }}
          />
          {isActive && (
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: mood.color }}
            />
          )}
        </div>

        {/* The toggle paddle */}
        <motion.div
          animate={{ y: isActive ? 2 : 16, rotateX: isActive ? -25 : 25 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="absolute left-[3px] right-[3px] h-[16px] rounded-[2px] flex items-center justify-center"
          style={{
            backgroundColor: isActive ? mood.color : '#2a2a2a',
            boxShadow: isActive
              ? `0 2px 0 rgba(0,0,0,0.6), 0 0 8px ${mood.color}60`
              : '0 2px 0 rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {[0, 1].map(i => (
            <div key={i} className="absolute left-[4px] right-[4px] h-px"
              style={{ top: `${5 + i * 4}px`, backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </motion.div>

        {/* ON/OFF label */}
        <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2">
          <span className="font-mono text-[5px] tracking-widest"
            style={{ color: isActive ? mood.color : 'rgba(255,255,255,0.2)' }}>
            {isActive ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Label plate */}
      <div
        className="w-full px-1 py-0.5 rounded-sm text-center transition-all duration-300"
        style={{
          backgroundColor: isActive ? `${mood.color}15` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isActive ? mood.color + '40' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <div className="font-mono text-[5px] tracking-[0.1em] uppercase leading-tight"
          style={{ color: isActive ? mood.color : 'rgba(255,255,255,0.3)' }}>
          {mood.label.replace('_', '\n')}
        </div>
        <div className="text-[9px] opacity-70">{mood.emoji}</div>
      </div>
    </button>
  );
};

// ─── TAPE PRINTOUT ────────────────────────────────────────────────────────────
const TapePrintout = ({ entries }: { entries: { label: string; color: string; time: string }[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-0 overflow-y-auto"
      style={{ scrollbarWidth: 'none', maxHeight: '100%' }}
    >
      {entries.map((e, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2 py-[3px] border-b border-white/[0.04]"
        >
          <span className="font-mono text-[6px] text-white/20 tabular-nums shrink-0">{e.time}</span>
          <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
          <span className="font-mono text-[7px] tracking-[0.2em] uppercase" style={{ color: e.color }}>
            {e.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function MissionControlConsole({
  currentMood,
  onMoodChange,
}: {
  currentMood: Mood;
  onMoodChange: (m: Mood) => void;
}) {
  const [tape, setTape] = useState<{ label: string; color: string; time: string }[]>([]);

  // Load mood history for tape
  useEffect(() => {
    supabase.from('mood_logs').select('mood_id, created_at')
      .order('created_at', { ascending: true })
      .limit(30)
      .then(({ data }) => {
        if (!data) return;
        setTape(data.map(row => {
          const mood = MOODS.find(m => m.label === row.mood_id) ?? MOODS[0];
          return {
            label: mood.label,
            color: mood.color,
            time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
        }));
      });
  }, []);

  const handleSwitch = (mood: Mood) => {
    onMoodChange(mood);
    setTape(prev => [...prev, {
      label: mood.label,
      color: mood.color,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden rounded-[inherit] relative"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #080808 100%)' }}>

      {/* Noise texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 1px,#000 1px,#000 2px)' }} />

      {/* Header panel */}
      <div className="shrink-0 relative z-10 px-5 pt-4 pb-3 border-b flex items-center justify-between"
        style={{ borderColor: `${currentMood.color}20` }}>
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentMood.color }} />
          <span className="font-mono text-[8px] tracking-[0.4em] text-white/40 uppercase">
            Atmosphere_Ctrl
          </span>
        </div>
        <div className="font-mono text-[8px] tracking-[0.3em] uppercase px-2 py-1 rounded"
          style={{ color: currentMood.color, backgroundColor: `${currentMood.color}15`, border: `1px solid ${currentMood.color}30` }}>
          {currentMood.label}
        </div>
      </div>

      {/* Main panel body */}
      <div className="flex-1 min-h-0 flex flex-col gap-0 relative z-10 overflow-hidden">

        {/* ── Switch bank ── */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="font-mono text-[6px] tracking-[0.4em] text-white/20 uppercase mb-2">
            Mood_Selector // Flip to engage
          </div>

          {/* Panel rack with rivets */}
          <div className="relative rounded p-3 pt-4"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05)',
            }}>

            {/* Rivet dots */}
            {[['tl','tr'],['bl','br']].map((row, ri) =>
              row.map(corner => (
                <div key={corner} className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: '#222',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.8)',
                    top: ri === 0 ? 4 : 'auto', bottom: ri === 1 ? 4 : 'auto',
                    left: corner.endsWith('l') ? 4 : 'auto', right: corner.endsWith('r') ? 4 : 'auto',
                  }} />
              ))
            )}

            {/* Channel label strip */}
            <div className="absolute top-[-1px] left-8 right-8 h-[2px] rounded-full"
              style={{ backgroundColor: `${currentMood.color}30` }} />

            <div className="flex justify-between items-start gap-1">
              {MOODS.map(mood => (
                <FlipSwitch
                  key={mood.label}
                  mood={mood}
                  isActive={currentMood.label === mood.label}
                  onClick={() => handleSwitch(mood)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom section: gauge + tape ── */}
        <div className="flex-1 min-h-0 flex gap-0 px-4 pb-4 overflow-hidden">

          {/* Gauge */}
          <div className="flex flex-col items-center w-[110px] shrink-0">
            <div className="font-mono text-[6px] tracking-[0.35em] text-white/20 uppercase mb-1 shrink-0">
              Mood_Pressure
            </div>
            <div className="flex-1 min-h-0 w-full overflow-hidden">
              <NeedleGauge value={currentMood.intensity} color={currentMood.color} />
            </div>
          </div>

          {/* Divider */}
          <div className="w-px mx-3 self-stretch" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

          {/* Tape printout */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="font-mono text-[6px] tracking-[0.35em] text-white/20 uppercase mb-2 shrink-0">
              State_Log // teletype
            </div>

            {/* Tape housing */}
            <div className="flex-1 min-h-0 relative overflow-hidden rounded-sm"
              style={{
                background: 'linear-gradient(180deg, #0a0a0a 0%, #060606 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.9)',
              }}>

              {/* Tape perforation edge */}
              <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col justify-around items-center py-1"
                style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>

              <div className="absolute inset-0 left-4 p-2 overflow-hidden">
                <TapePrintout entries={tape} />
              </div>

              {/* Fade top */}
              <div className="absolute top-0 left-3 right-0 h-6 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, #0a0a0a, transparent)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}