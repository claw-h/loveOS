"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ─── MINI CONSTELLATION SPHERE ────────────────────────────────────────────────
const VaultSphereCanvas = ({ accentColor, isHovered, memoryCount }: {
  accentColor: string;
  isHovered: boolean;
  memoryCount: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate stable node positions on a sphere
    const nodeCount = Math.min(Math.max(memoryCount, 12), 40);
    const nodes: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      // Fibonacci sphere distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / nodeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      nodes.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
      });
    }

    // MST-like edges: connect each node to nearest 2 neighbors
    const edges: [number, number][] = [];
    nodes.forEach((a, i) => {
      const dists = nodes
        .map((b, j) => ({ j, d: Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2) }))
        .filter(({ j }) => j !== i)
        .sort((a, b) => a.d - b.d);
      dists.slice(0, 2).forEach(({ j }, k) => {
        const pair = dists[k];
        if (pair && !edges.some(([a, b]) => (a === i && b === pair.j) || (a === pair.j && b === i))) {
          edges.push([i, pair.j]);
        }
      });
    });

    const draw = () => {
      tRef.current += isHovered ? 0.012 : 0.004;
      const t = tRef.current;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) * 0.36;

      // Rotate around Y axis
      const cosY = Math.cos(t);
      const sinY = Math.sin(t);
      // Slight tilt on X
      const cosX = Math.cos(0.3);
      const sinX = Math.sin(0.3);

      const projected = nodes.map(({ x, y, z }) => {
        // Rotate Y
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        // Rotate X
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const scale = 1 / (1.8 - z2 * 0.4);
        return {
          px: cx + x1 * r * scale,
          py: cy + y1 * r * scale,
          depth: z2,
          scale,
        };
      });

      // Ambient glow
      if (isHovered) {
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.2);
        glow.addColorStop(0, `${accentColor}18`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Faint sphere outline
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `${accentColor}15`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Equatorial ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * Math.abs(Math.sin(0.3)), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${accentColor}10`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Edges (back → front)
      edges.forEach(([ai, bi]) => {
        const a = projected[ai];
        const b = projected[bi];
        const avgDepth = (a.depth + b.depth) / 2;
        const opacity = isHovered
          ? 0.1 + (avgDepth + 1) * 0.25
          : 0.05 + (avgDepth + 1) * 0.1;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.strokeStyle = `${accentColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Nodes
      projected.forEach(({ px, py, depth, scale }, i) => {
        const isBack = depth < 0;
        const size = (isBack ? 1.2 : 2) * scale;
        const opacity = isBack
          ? 0.15
          : isHovered ? 0.5 + depth * 0.4 : 0.25 + depth * 0.2;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `${accentColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        if (!isBack && isHovered) {
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Brightest front node pulses
      const frontNodes = projected
        .map((p, i) => ({ ...p, i }))
        .filter(p => p.depth > 0.6)
        .sort((a, b) => b.depth - a.depth)
        .slice(0, 2);

      frontNodes.forEach(({ px, py }) => {
        const pulse = (Math.sin(t * 3) + 1) / 2;
        ctx.beginPath();
        ctx.arc(px, py, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10 + pulse * 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [accentColor, isHovered, memoryCount]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// ─── VAULT PORTAL ─────────────────────────────────────────────────────────────
export default function VaultPortal({
  memoryCount = 0,
  accentColor = '#F59E0B',
}: {
  memoryCount?: number;
  accentColor?: string;
}) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const handleClick = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    // Brief charge-up delay before navigating
    setTimeout(() => router.push('/vault'), 800);
  };

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#05030A] rounded-[inherit] cursor-pointer select-none"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Scanline */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)' }}
      />

      {/* Launch flash */}
      <AnimatePresence>
        {isLaunching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-50 pointer-events-none rounded-[inherit]"
            style={{ backgroundColor: accentColor }}
          />
        )}
      </AnimatePresence>

      {/* Hover vignette lift */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ background: `radial-gradient(ellipse at center, ${accentColor}08 0%, transparent 70%)` }}
      />

      {/* Sphere canvas — center stage */}
      <motion.div
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full flex-1 min-h-0 z-20"
      >
        <VaultSphereCanvas
          accentColor={accentColor}
          isHovered={isHovered}
          memoryCount={memoryCount}
        />
      </motion.div>

      {/* Labels */}
      <div className="relative z-20 flex flex-col items-center gap-2 pb-8 shrink-0">
        <motion.div
          animate={{ opacity: isHovered ? 1 : 0.4 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <motion.div
            animate={{ scale: isHovered ? [1, 1.4, 1] : 1, opacity: isHovered ? 1 : 0.5 }}
            transition={{ duration: 1.2, repeat: isHovered ? Infinity : 0 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor, boxShadow: isHovered ? `0 0 8px ${accentColor}` : 'none' }}
          />
          <span className="font-mono text-[9px] tracking-[0.4em] text-white/60 uppercase">
            {memoryCount > 0 ? `${memoryCount} nodes indexed` : 'Vault online'}
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLaunching ? (
            <motion.span
              key="launching"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-[10px] tracking-[0.5em] uppercase"
              style={{ color: accentColor }}
            >
              Initializing...
            </motion.span>
          ) : (
            <motion.span
              key="enter"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0.3 }}
              className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/50"
            >
              {isHovered ? '→ Enter Vault' : 'Memory_Vault'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Corner brackets that close in on hover */}
      {['tl', 'tr', 'bl', 'br'].map((corner) => (
        <motion.div
          key={corner}
          animate={{ opacity: isHovered ? 0.8 : 0.2 }}
          transition={{ duration: 0.3 }}
          className="absolute w-5 h-5 pointer-events-none z-30"
          style={{
            top: corner.startsWith('t') ? 12 : 'auto',
            bottom: corner.startsWith('b') ? 12 : 'auto',
            left: corner.endsWith('l') ? 12 : 'auto',
            right: corner.endsWith('r') ? 12 : 'auto',
            borderTop: corner.startsWith('t') ? `1px solid ${accentColor}` : 'none',
            borderBottom: corner.startsWith('b') ? `1px solid ${accentColor}` : 'none',
            borderLeft: corner.endsWith('l') ? `1px solid ${accentColor}` : 'none',
            borderRight: corner.endsWith('r') ? `1px solid ${accentColor}` : 'none',
          }}
        />
      ))}
    </div>
  );
}