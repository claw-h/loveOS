"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Quote {
  id: string;
  quote_text: string;
  author: string;
  created_at: string;
}

// ─── WAVEFORM CANVAS ─────────────────────────────────────────────────────────
const WaveformCanvas = ({ text, color, isActive }: { text: string; color: string; isActive: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  const samples = useMemo(() => {
    const src = text || 'x';
    return Array.from({ length: 80 }, (_, i) => (src.charCodeAt(i % src.length) % 128) / 128);
  }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      tRef.current += isActive ? 0.035 : 0.007;
      const t = tRef.current;
      const W = canvas.width = canvas.clientWidth;
      const H = canvas.height = canvas.clientHeight;
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);

      const midY = H / 2;
      const step = W / (samples.length - 1);
      const amp = (H / 2) * (isActive ? 0.75 : 0.25);

      [1, 0.45, 0.2].forEach((harmonic, hi) => {
        ctx.beginPath();
        samples.forEach((s, i) => {
          const y = midY + (Math.sin(t + i * 0.18) * (s - 0.5) + Math.sin(t * 1.3 + i * 0.09) * 0.3) * amp * harmonic;
          i === 0 ? ctx.moveTo(i * step, y) : ctx.lineTo(i * step, y);
        });
        const alphas = isActive ? [0.85, 0.25, 0.08] : [0.25, 0.08, 0.03];
        ctx.strokeStyle = hi === 0
          ? `${color}${Math.floor(alphas[hi] * 255).toString(16).padStart(2,'0')}`
          : `rgba(255,255,255,${alphas[hi] * 0.5})`;
        ctx.lineWidth = [1.5, 1, 0.5][hi];
        ctx.stroke();
      });

      if (isActive) {
        const scanX = (t * 18) % W;
        ctx.beginPath(); ctx.moveTo(scanX, 0); ctx.lineTo(scanX, H);
        ctx.strokeStyle = `${color}22`; ctx.lineWidth = 1; ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [samples, color, isActive]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// ─── SIGNAL BLIP ─────────────────────────────────────────────────────────────
const SignalBlip = ({ quote, isLatest, isSelected, onClick, color }: {
  quote: Quote; isLatest: boolean; isSelected: boolean; onClick: () => void; color: string;
}) => {
  const strength = Math.min(1, quote.quote_text.length / 120);
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group outline-none relative shrink-0">
      {/* Bars */}
      <div className="flex items-end gap-[2px] h-6">
        {Array.from({ length: 5 }).map((_, bi) => (
          <div key={bi} className="w-[3px] rounded-sm transition-all duration-300"
            style={{
              height: `${40 + bi * 12}%`,
              backgroundColor: bi < Math.ceil(strength * 5)
                ? isSelected ? color : `${color}55`
                : 'rgba(255,255,255,0.07)',
              boxShadow: bi < Math.ceil(strength * 5) && isSelected ? `0 0 3px ${color}` : 'none',
            }}
          />
        ))}
      </div>

      {/* Dot */}
      <div className="w-1.5 h-1.5 rounded-full transition-all duration-300 relative"
        style={{ backgroundColor: isSelected ? color : 'rgba(255,255,255,0.15)',
          boxShadow: isSelected ? `0 0 5px ${color}` : 'none' }}>
        {isLatest && (
          <motion.div animate={{ scale: [1,2.2,1], opacity: [0.4,0,0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
        )}
      </div>

      {/* Mini waveform */}
      <div className="w-7 h-3 opacity-25 group-hover:opacity-55 transition-opacity">
        <WaveformCanvas text={quote.quote_text.slice(0,16)} color={color} isActive={isSelected} />
      </div>

      {/* Date */}
      <span className="font-mono text-[6px] text-white/20 group-hover:text-white/45 transition-colors whitespace-nowrap">
        {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>

      {isSelected && (
        <motion.div layoutId="blip-ring"
          className="absolute -inset-1 rounded border pointer-events-none"
          style={{ borderColor: `${color}35` }} />
      )}
    </button>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function TransmissionArchive({ accentColor = '#F59E0B' }: { accentColor?: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const blipRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    supabase.from('daily_quotes').select('*').order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data?.length) { setQuotes(data); setSelectedIdx(data.length - 1); }
        setIsLoading(false);
      });

    const ch = supabase.channel('directive-archive')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_quotes' }, ({ new: row }) => {
        setQuotes(prev => {
          const next = [...prev, row as Quote];
          setSelectedIdx(next.length - 1);
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 500);
          return next;
        });
      }).subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // Scroll timeline — only touches the timeline div, never the page
  useEffect(() => {
    const container = timelineRef.current;
    const el = blipRefs.current[selectedIdx];
    if (!container || !el) return;
    const cr = container.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    container.scrollTo({
      left: container.scrollLeft + er.left - cr.left - cr.width / 2 + er.width / 2,
      behavior: 'smooth',
    });
  }, [selectedIdx]);

  const current = quotes[selectedIdx] ?? null;

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#05030A] rounded-[inherit]">
        <motion.div animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="font-mono text-[9px] tracking-[0.4em] text-white/30 uppercase">
          Scanning archive...
        </motion.div>
      </div>
    );
  }

  return (
    /*
     * LAYOUT CONTRACT:
     * - h-full / w-full fills the card slot exactly
     * - overflow-hidden on root prevents ANY content from escaping
     * - flex-col with fixed shrink-0 sections + flex-1 min-h-0 middle
     *   means the quote area absorbs spare space but can never push siblings
     */
    <div className="h-full w-full flex flex-col bg-[#05030A] overflow-hidden rounded-[inherit] relative">

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 1px,#000 1px,#000 2px)' }} />

      {/* Flash */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div key="flash" initial={{ opacity: 0.18 }} animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 pointer-events-none rounded-[inherit]"
            style={{ backgroundColor: accentColor }} />
        )}
      </AnimatePresence>

      {/* Traveling scan line */}
      <motion.div animate={{ top: ['-1px','100%'] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-px z-20 pointer-events-none"
        style={{ background: `linear-gradient(to right, transparent, ${accentColor}22, transparent)` }} />

      {/* Header — shrink-0 */}
      <div className="shrink-0 relative z-30 flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
          <span className="font-mono text-[8px] tracking-[0.3em] text-white/35 uppercase truncate">
            Transmission_Archive
          </span>
        </div>
        <span className="font-mono text-[8px] text-white/20 shrink-0 ml-2 tabular-nums">
          {String(selectedIdx + 1).padStart(3,'0')}/{String(quotes.length).padStart(3,'0')}
        </span>
      </div>

      {/* Quote area — flex-1 min-h-0, never expands card */}
      <div className="flex-1 min-h-0 relative overflow-hidden px-5 flex flex-col justify-center z-20">
        {/* Waveform bg */}
        <div className="absolute inset-0 opacity-12 pointer-events-none">
          {current && <WaveformCanvas text={current.quote_text} color={accentColor} isActive />}
        </div>

        {/* Big " */}
        <div className="absolute top-0 left-1 font-black leading-none pointer-events-none select-none"
          style={{ fontSize: 'clamp(4rem,10vw,10rem)', color: `${accentColor}05` }}>"</div>

        {/* Quote — fade only, no x/y movement */}
        <AnimatePresence mode="wait">
          {current && (
            <motion.div key={current.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10">

              {/* Text — word-break + max font size kept small enough */}
              <p className="font-black uppercase tracking-tight leading-snug text-[#F5F5F0] break-words hyphens-auto"
                style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.6rem)' }}>
                "{current.quote_text}"
              </p>

              {/* Author — fade in after quote */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-4 flex items-center gap-3">
                <div className="w-8 h-px shrink-0" style={{ backgroundColor: `${accentColor}45` }} />
                <span className="font-mono text-[8px] tracking-[0.3em] uppercase truncate"
                  style={{ color: accentColor }}>
                  {current.author}
                </span>
              </motion.div>

              {/* Timestamp */}
              <div className="mt-1.5 ml-11">
                <span className="font-mono text-[7px] tracking-[0.2em] text-white/18 uppercase">
                  {new Date(current.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav — shrink-0 */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2 z-20 relative">
        <button onClick={() => setSelectedIdx(i => Math.max(0, i-1))} disabled={selectedIdx === 0}
          className="font-mono text-[7px] tracking-[0.25em] uppercase px-2.5 py-1 rounded border border-white/10 hover:border-white/25 text-white/30 hover:text-white/65 disabled:opacity-15 disabled:cursor-not-allowed transition-all">
          ← PREV
        </button>
        <button onClick={() => setSelectedIdx(i => Math.min(quotes.length-1, i+1))} disabled={selectedIdx === quotes.length - 1}
          className="font-mono text-[7px] tracking-[0.25em] uppercase px-2.5 py-1 rounded border border-white/10 hover:border-white/25 text-white/30 hover:text-white/65 disabled:opacity-15 disabled:cursor-not-allowed transition-all">
          NEXT →
        </button>
      </div>

      {/* Timeline — shrink-0, fully scroll-contained */}
      <div className="shrink-0 border-t border-white/[0.05] bg-black/20 px-4 pt-2.5 pb-3 z-20 relative">
        <div className="mb-1.5">
          <span className="font-mono text-[6px] tracking-[0.35em] text-white/18 uppercase">
            Signal Timeline · {quotes.length} logged
          </span>
        </div>
        <div ref={timelineRef}
          className="flex items-end gap-3.5 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {quotes.map((q, i) => (
            <div key={q.id} ref={el => { blipRefs.current[i] = el; }} className="shrink-0">
              <SignalBlip quote={q} isLatest={i === quotes.length - 1}
                isSelected={i === selectedIdx} onClick={() => setSelectedIdx(i)} color={accentColor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}