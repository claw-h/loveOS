// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import TopControls from "@/components/TopControls";
import Link from "next/link";

// ─── Mood data (mirrors dashboard) ───────────────────────────────────────────
const MOODS = [
  { label: "OPTIMAL",       color: "#F59E0B", emoji: "✧" },
  { label: "ANXIOUS",       color: "#A78BFA", emoji: "≈" },
  { label: "LOW POWER",     color: "#D4D4D8", emoji: "☾" },
  { label: "CRITICAL",      color: "#DC2626", emoji: "⚠" },
  { label: "MISSING_ADMIN", color: "#14B8A6", emoji: "⍙" },
];
const DEFAULT_MOOD = MOODS[0];

// ─── CoreNebula (identical to dashboard) ─────────────────────────────────────
const CoreNebula = ({ mood }: { mood: typeof MOODS[0] }) => {
  const getPhysics = () => {
    switch (mood.label) {
      case "OPTIMAL":    return { speed1: 12, speed2: 8,  pulse: [0.9, 1.1, 0.9],         coreGlow: "0 0 20px 8px"  };
      case "ANXIOUS":    return { speed1: 2,  speed2: 1.5,pulse: [0.8, 1.4, 0.7, 1.3],    coreGlow: "0 0 30px 12px" };
      case "LOW POWER":  return { speed1: 30, speed2: 40, pulse: [0.95, 1.05, 0.95],       coreGlow: "0 0 10px 2px"  };
      case "CRITICAL":   return { speed1: 0.8,speed2: 1.2,pulse: [1, 1.6, 1],              coreGlow: "0 0 40px 15px" };
      default:           return { speed1: 12, speed2: 8,  pulse: [1, 1, 1],                coreGlow: "0 0 20px 8px"  };
    }
  };
  const p = getPhysics();
  return (
    <div className="relative w-[70px] h-[70px] rounded-full p-[3px] bg-[#161616] shadow-[0_15px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#2a2a2a] shrink-0">
      <div className="relative w-full h-full rounded-full bg-[#020202] shadow-[inset_0_6px_20px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center border border-black">
        <div className="absolute inset-0 opacity-50 mix-blend-screen pointer-events-none z-0"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <motion.div animate={{ rotate: 360 }}  transition={{ duration: p.speed1, repeat: Infinity, ease: "linear" }} className="absolute w-[85%] h-[85%] rounded-full border-[2px] border-dashed border-white/10 z-10 will-change-transform" style={{ borderTopColor: "var(--accent)", borderBottomColor: "var(--accent)" }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: p.speed2, repeat: Infinity, ease: "linear" }} className="absolute w-[60%] h-[60%] rounded-full border border-transparent z-10 will-change-transform" style={{ borderLeftColor: "var(--accent)", borderRightColor: "var(--accent)" }} />
        <motion.div animate={{ scale: p.pulse }} transition={{ duration: p.speed2 / 2, repeat: Infinity, ease: "easeInOut" }} className="absolute w-1.5 h-1.5 bg-white rounded-full z-10 will-change-transform" style={{ boxShadow: `0 0 5px 2px #fff, ${p.coreGlow} var(--accent)` }} />
        <span className="relative z-20 text-[22px] font-black mix-blend-screen" style={{ color: "#ffffff", textShadow: "0 0 10px var(--accent), 0 0 20px var(--accent)" }}>{mood.emoji}</span>
      </div>
    </div>
  );
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface MemoryRow {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  memory_date: string;
  cluster_name: string | null;
  decay: number | null;
}

interface Memory {
  id: string;
  title: string;
  caption: string;
  date: string;
  thumb: string;
  decay: number;
  clusterId: number;
}

// ─── Module-level canvas state ────────────────────────────────────────────────
let MEMORIES: Memory[] = [];
let clusterNameMap: Record<string, number> = {};

const rowToMemory = (row: MemoryRow): Memory => {
  const name = row.cluster_name || "Uncategorised";
  if (clusterNameMap[name] === undefined)
    clusterNameMap[name] = Object.keys(clusterNameMap).length;
  return {
    id:        row.id,
    title:     row.title || row.caption,
    caption:   row.caption || "",
    date:      row.memory_date,
    thumb:     row.image_url,
    decay:     row.decay ?? 1,
    clusterId: clusterNameMap[name],
  };
};

// ─── Upgrade #1: decay → node color ──────────────────────────────────────────
// Returns [r,g,b] for a given decay value.
const decayRgb = (d: number): [number, number, number] => {
  if (d > 0.8) return [232, 222, 181]; // warm gold
  if (d > 0.4) return [140, 170, 220]; // cool steel blue
  return [200, 80, 60];                // dying ember red
};

const dColCss = (d: number) => {
  if (d > 0.8) return "var(--accent)";
  if (d > 0.4) return "rgba(140, 170, 220, 0.9)";
  return "rgba(200, 80, 60, 0.9)";
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SphericalNightSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selected,    setSelected]    = useState<Memory | null>(null);
  const [hovered,     setHovered]     = useState<Memory | null>(null);
  const [zoom,        setZoom]        = useState(1);
  const [memCount,    setMemCount]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [decays,      setDecays]      = useState<Record<string, number>>({});
  const [currentMood, setCurrentMood] = useState(DEFAULT_MOOD);
  // Upgrade #12: auto-rotate toggle
  const [autoRotate,  setAutoRotate]  = useState(true);
  // Upgrade #11: spin speed for HUD display
  const [spinSpeed,   setSpinSpeed]   = useState(0);
  // Track node screen position for panel origin animation (#9)
  const selectedNodePos = useRef<{ x: number; y: number } | null>(null);
  // Upgrade #9: animate panel entry from node position
  const [panelReady,  setPanelReady]  = useState(false);

  const rotX     = useRef(0);
  const rotY     = useRef(0);
  const vX       = useRef(0.0005);
  const vY       = useRef(0.001);
  const timeRef  = useRef(0);
  const frameRef = useRef(0);
  const autoRotateRef = useRef(true); // mirror for canvas loop

  const isDragging = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });
  const lastMouse  = useRef({ x: 0, y: 0 });

  const constellationsRef = useRef<any[]>([]);
  const uniStarsRef       = useRef<any[]>([]);
  const nebulasRef        = useRef<any[]>([]);
  // Upgrade #4: ambient dust particles
  const dustRef           = useRef<any[]>([]);

  const shootingStarsRef  = useRef<{ x: number; y: number; born: number }[]>([]);
  const newNodeIdRef      = useRef<string | null>(null);

  const ACCENT_RGB = "232, 222, 181";
  const BG_COLOR   = "#05030A";
  const MOOD_COLOR = "#EC4899";

  // ─── Prim MST on 3-D node positions ──────────────────────────────────────
  const buildMST = (nodes: any[]): [number, number][] => {
    if (nodes.length < 2) return [];
    const n = nodes.length;
    const inTree  = new Array(n).fill(false);
    const minDist = new Array(n).fill(Infinity);
    const parent  = new Array(n).fill(-1);
    minDist[0] = 0;
    const edges: [number, number][] = [];
    for (let step = 0; step < n; step++) {
      let u = -1;
      for (let v = 0; v < n; v++)
        if (!inTree[v] && (u === -1 || minDist[v] < minDist[u])) u = v;
      inTree[u] = true;
      if (parent[u] !== -1) edges.push([parent[u], u]);
      for (let v = 0; v < n; v++) {
        if (inTree[v]) continue;
        const dx = nodes[u].nx - nodes[v].nx;
        const dy = nodes[u].ny - nodes[v].ny;
        const dz = nodes[u].nz - nodes[v].nz;
        const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < minDist[v]) { minDist[v] = d; parent[v] = u; }
      }
    }
    // 1-2 bonus cross-edges for visual branching
    const bonusCount = Math.min(2, Math.floor(n / 4));
    const edgeSet = new Set(edges.map(([a, b]) => `${a}-${b}`));
    let added = 0;
    for (let a = 0; a < n && added < bonusCount; a++) {
      for (let b = a + 2; b < n && added < bonusCount; b++) {
        if (!edgeSet.has(`${a}-${b}`) && !edgeSet.has(`${b}-${a}`)) {
          const dx = nodes[a].nx - nodes[b].nx;
          const dy = nodes[a].ny - nodes[b].ny;
          const dz = nodes[a].nz - nodes[b].nz;
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 0.55) {
            edges.push([a, b]); edgeSet.add(`${a}-${b}`); added++;
          }
        }
      }
    }
    return edges;
  };

  // ─── Build constellation geometry ─────────────────────────────────────────
  const buildConstellations = () => {
    const TOTAL_CLUSTERS = 40;
    const clusters = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < TOTAL_CLUSTERS; i++) {
      const t   = i / (TOTAL_CLUSTERS - 1);
      const inc = Math.acos(1 - 2 * t);
      const azi = 2 * Math.PI * goldenRatio * i;
      const cx  = Math.sin(inc) * Math.cos(azi);
      const cy  = Math.sin(inc) * Math.sin(azi);
      const cz  = Math.cos(inc);

      const myMemories = MEMORIES.filter(m => m.clusterId === i);
      const nodes: any[] = [];

      // Random elongation axis per cluster — produces chain/figure shapes
      const elongation = Math.random() * 0.55 + 0.28;
      const axisAngle  = Math.random() * Math.PI * 2;
      const axisAngle2 = Math.random() * Math.PI * 2;

      const placeNode = (mem: any | null, isFake: boolean) => {
        const r     = Math.pow(Math.random(), 0.55) * (isFake ? 0.32 : 0.48);
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.random() * Math.PI;
        const ox = r * elongation * Math.cos(theta) * Math.sin(phi);
        const oy = r             * Math.sin(theta) * Math.sin(phi);
        const oz = r * elongation * Math.cos(phi);
        const rx = ox * Math.cos(axisAngle) - oz * Math.sin(axisAngle);
        const rz = ox * Math.sin(axisAngle) + oz * Math.cos(axisAngle);
        const ry = oy * Math.cos(axisAngle2) - rz * Math.sin(axisAngle2);
        nodes.push({
          nx: cx + rx, ny: cy + ry, nz: cz + rz,
          baseSize: isFake ? Math.random() * 1.2 + 0.4 : Math.random() * 4.0 + 1.5,
          phase:  Math.random() * Math.PI * 2,
          speed:  Math.random() * 0.02 + (isFake ? 0 : 0.01),
          memory: mem,
        });
      };

      if (myMemories.length > 0) {
        myMemories.forEach(mem => placeNode(mem, false));
      } else {
        const fakeCount = Math.floor(Math.pow(Math.random(), 0.45) * 11) + 3;
        for (let f = 0; f < fakeCount; f++) placeNode(null, true);
      }

      const mstEdges = buildMST(nodes);
      const clusterLabel = Object.entries(clusterNameMap).find(([, v]) => v === i)?.[0] || null;
      clusters.push({ cx, cy, cz, nodes, mstEdges, hasRealData: myMemories.length > 0, label: clusterLabel });
    }
    constellationsRef.current = clusters;
  };

  // ─── Fetch + rebuild ───────────────────────────────────────────────────────
  const refetchAndRebuild = async () => {
    const { data, error } = await supabase
      .from("memories")
      .select("id, title, caption, image_url, memory_date, cluster_name, decay")
      .order("memory_date", { ascending: true });

    if (error || !data) return;
    clusterNameMap = {};
    MEMORIES = data.map(rowToMemory);
    const newDecays = Object.fromEntries(MEMORIES.map(m => [m.id, m.decay]));
    setDecays(newDecays);
    setMemCount(MEMORIES.length);
    buildConstellations();
  };

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    refetchAndRebuild().then(() => setLoading(false));

    // Fetch current mood
    supabase.from("mood_logs").select("mood_id").order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const m = MOODS.find(x => x.label === data[0].mood_id);
          if (m) { setCurrentMood(m); document.documentElement.style.setProperty("--accent", m.color); }
        }
      });

    // Realtime mood updates
    const moodCh = supabase.channel("vault-mood")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mood_logs" }, (payload) => {
        const m = MOODS.find(x => x.label === payload.new.mood_id);
        if (m) { setCurrentMood(m); document.documentElement.style.setProperty("--accent", m.color); }
      }).subscribe();

    return () => { supabase.removeChannel(moodCh); };
  }, []);

  // ─── Background stars + nebulae + dust (built once) ───────────────────────
  useEffect(() => {
    // Stars
    const stars: any[] = [];
    for (let i = 0; i < 2000; i++) {
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
      const isSupernova = Math.random() > 0.98;
      stars.push({
        nx: Math.sin(phi) * Math.cos(theta),
        ny: Math.sin(phi) * Math.sin(theta),
        nz: Math.cos(phi),
        baseSize: isSupernova ? 1.5 : Math.random() > 0.8 ? 1.0 : 0.4,
        phase:    Math.random() * Math.PI * 2,
        speed:    (Math.random() * 0.02 + 0.005) * (isSupernova ? 2 : 1),
        isSupernova,
      });
    }
    uniStarsRef.current = stars;

    // Nebulae
    const nebColors = [
      `rgba(${ACCENT_RGB},`,
      `rgba(70, 30, 100,`,
      `rgba(30, 60, 150,`,
    ];
    const nebs: any[] = [];
    for (let i = 0; i < 15; i++) {
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
      const clouds: any[] = [];
      for (let c = 0; c < 15; c++) {
        clouds.push({
          dx:   (Math.random() - 0.5) * 0.4,
          dy:   (Math.random() - 0.5) * 0.4,
          dz:   (Math.random() - 0.5) * 0.4,
          size: Math.random() * 250 + 100,
        });
      }
      nebs.push({
        nx: Math.sin(phi) * Math.cos(theta),
        ny: Math.sin(phi) * Math.sin(theta),
        nz: Math.cos(phi),
        colorBase: nebColors[Math.floor(Math.random() * nebColors.length)],
        clouds,
      });
    }
    nebulasRef.current = nebs;

    // Upgrade #4: ambient 2D dust particles (independent of sphere rotation)
    const dust: any[] = [];
    for (let i = 0; i < 30; i++) {
      dust.push({
        x:    Math.random(),          // 0–1 of screen width
        y:    Math.random(),          // 0–1 of screen height
        vx:   (Math.random() - 0.5) * 0.00008,
        vy:   (Math.random() - 0.5) * 0.00008,
        size: Math.random() * 1.0 + 0.3,
        op:   Math.random() * 0.25 + 0.1,
        opDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    dustRef.current = dust;
  }, []);

  // ─── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("vault-realtime")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "memories" },
        async (payload) => {
          await refetchAndRebuild();
          newNodeIdRef.current = (payload.new as MemoryRow).id;
          setTimeout(() => { newNodeIdRef.current = null; }, 4000);
          shootingStarsRef.current.push({
            x: 0.55 + Math.random() * 0.35,
            y: 0.02 + Math.random() * 0.25,
            born: frameRef.current,
          });
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "memories" },
        (payload) => {
          const row      = payload.new as MemoryRow;
          const newDecay = row.decay ?? 1;
          const newTitle = row.title || row.caption;
          const mem = MEMORIES.find(m => m.id === row.id);
          if (mem) { mem.decay = newDecay; mem.title = newTitle; }
          setDecays(prev => ({ ...prev, [row.id]: newDecay }));
          setSelected(prev =>
            prev?.id === row.id ? { ...prev, decay: newDecay, title: newTitle } : prev
          );
        })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "memories" },
        async (payload) => {
          const deletedId = (payload.old as MemoryRow).id;
          setSelected(prev => (prev?.id === deletedId ? null : prev));
          await refetchAndRebuild();
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── Upgrade #10: scroll-wheel zoom ────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.min(2, Math.max(0.5, z - e.deltaY * 0.001)));
    };
    const canvas = canvasRef.current;
    canvas?.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas?.removeEventListener("wheel", onWheel);
  }, []);

  // ─── Canvas draw loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const project = (
      nx: number, ny: number, nz: number,
      radius: number, fov: number,
      cx: number, sx: number, cy: number, sy: number,
      W: number, H: number
    ) => {
      const x1 = nx * cx - nz * sx, z1 = nz * cx + nx * sx;
      const y2 = ny * cy - z1 * sy, z2 = z1 * cy + ny * sy;
      const px = x1 * radius, py = y2 * radius, pz = z2 * radius;
      const scale = fov / (fov + pz);
      return { sx2D: W / 2 + px * scale, sy2D: H / 2 + py * scale, pz, scale };
    };

    const draw = () => {
      frameRef.current += 1;
      timeRef.current  += 1;
      const frame = frameRef.current;
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, W, H);

      // ── Upgrade #12: auto-rotate velocity logic ──
      if (!isDragging.current) {
        if (autoRotateRef.current) {
          vX.current *= 0.95; vY.current *= 0.95;
          if (Math.abs(vX.current) < 0.0005) vX.current = Math.sign(vX.current) * 0.0005;
          if (Math.abs(vY.current) < 0.0005) vY.current = Math.sign(vY.current) * 0.0005;
        } else {
          // Decay to a full stop when auto-rotate is off
          vX.current *= 0.88; vY.current *= 0.88;
          if (Math.abs(vX.current) < 0.00001) vX.current = 0;
          if (Math.abs(vY.current) < 0.00001) vY.current = 0;
        }
      }
      rotX.current += vX.current;
      rotY.current += vY.current;

      // Upgrade #11: expose spin speed to React HUD every 20 frames
      if (frame % 20 === 0) {
        setSpinSpeed(parseFloat(
          (Math.hypot(vX.current, vY.current) * (180 / Math.PI)).toFixed(3)
        ));
      }

      const cx = Math.cos(rotX.current), sx = Math.sin(rotX.current);
      const cy = Math.cos(rotY.current), sy = Math.sin(rotY.current);

      const maxEdge  = Math.max(W, H), minEdge = Math.min(W, H);
      const uniRad   = maxEdge * 1.5;
      const uniFov   = maxEdge * 2.0;
      const vaultRad = minEdge * 0.40 * zoom;
      const vaultFov = minEdge * 0.65 * zoom;

      const renderQueue: any[] = [];
      let newHovered: Memory | null = null;

      nebulasRef.current.forEach(n => {
        n.clouds.forEach((cloud: any) => {
          const proj = project(n.nx + cloud.dx, n.ny + cloud.dy, n.nz + cloud.dz, uniRad, uniFov, cx, sx, cy, sy, W, H);
          if (proj.scale > 0 && proj.pz > -uniFov * 0.9)
            renderQueue.push({ type: "cloud", item: n, cloudData: cloud, ...proj });
        });
      });

      uniStarsRef.current.forEach(s => {
        const proj = project(s.nx, s.ny, s.nz, uniRad, uniFov, cx, sx, cy, sy, W, H);
        if (proj.scale > 0 && proj.pz > -uniFov * 0.9)
          renderQueue.push({ type: "uniStar", item: s, ...proj });
      });

      constellationsRef.current.forEach(cluster => {
        const projNodes = cluster.nodes.map((p: any) => {
          const proj = project(p.nx, p.ny, p.nz, vaultRad, vaultFov, cx, sx, cy, sy, W, H);
          const distFromCenter = Math.hypot(proj.sx2D - W / 2, proj.sy2D - H / 2);

          if (!isDragging.current && lastMouse.current.x > 0 &&
              distFromCenter < vaultRad * 1.05 && p.memory && proj.pz > 0) {
            if (Math.hypot(proj.sx2D - lastMouse.current.x, proj.sy2D - lastMouse.current.y) < 25 * proj.scale)
              newHovered = p.memory;
          }

          const rItem = { type: "node", item: p, isReal: !!p.memory, ...proj };
          renderQueue.push(rItem);
          return rItem;
        });

        // Draw MST edges instead of all-pairs distance check
        cluster.mstEdges?.forEach(([ai, bi]: [number, number]) => {
          const p1 = projNodes[ai], p2 = projNodes[bi];
          if (!p1 || !p2) return;
          const dist = Math.hypot(p1.sx2D - p2.sx2D, p1.sy2D - p2.sy2D);
          const linePhase = (ai * 2.4 + bi * 1.7) % (Math.PI * 2);
          renderQueue.push({ type: "line", p1, p2, pz: (p1.pz + p2.pz) / 2, dist, isReal: cluster.hasRealData, linePhase });
        });

        // Upgrade #2: cluster label — project centroid, show if near front
        if (cluster.hasRealData && cluster.label) {
          const cProj = project(cluster.cx, cluster.cy, cluster.cz, vaultRad, vaultFov, cx, sx, cy, sy, W, H);
          if (cProj.pz > vaultRad * 0.1 && cProj.scale > 0.85) {
            renderQueue.push({ type: "clusterLabel", label: cluster.label, ...cProj });
          }
        }
      });

      if (!isDragging.current) setHovered(newHovered);

      renderQueue.sort((a, b) => b.pz - a.pz);

      // ── Clouds + background stars ──
      renderQueue.forEach(obj => {
        if (obj.type === "cloud") {
          ctx.globalCompositeOperation = "screen";
          const radius = Math.max(0.1, obj.cloudData.size * obj.scale);
          const grad = ctx.createRadialGradient(obj.sx2D, obj.sy2D, 0, obj.sx2D, obj.sy2D, radius);
          grad.addColorStop(0,   `${obj.item.colorBase} ${0.1  * obj.scale})`);
          grad.addColorStop(0.5, `${obj.item.colorBase} ${0.03 * obj.scale})`);
          grad.addColorStop(1,   "transparent");
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(obj.sx2D, obj.sy2D, radius, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = "source-over";

        } else if (obj.type === "uniStar") {
          const s     = obj.item;
          const phase = s.phase + timeRef.current * s.speed;
          const tw    = Math.pow((Math.sin(phase) + 1) / 2, 6);
          const size  = s.baseSize * obj.scale * 1.5;
          ctx.fillStyle = `rgba(255,255,255,${0.1 + tw * 0.7})`;
          ctx.beginPath(); ctx.arc(obj.sx2D, obj.sy2D, size, 0, Math.PI * 2); ctx.fill();
          if (s.isSupernova && tw > 0.8) {
            const fa = (tw - 0.8) * 5, fs = size * 8;
            ctx.strokeStyle = `rgba(255,255,255,${fa * 0.8})`; ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(obj.sx2D, obj.sy2D - fs); ctx.lineTo(obj.sx2D, obj.sy2D + fs);
            ctx.moveTo(obj.sx2D - fs, obj.sy2D); ctx.lineTo(obj.sx2D + fs, obj.sy2D);
            ctx.stroke();
          }
        }
      });

      // ── Upgrade #4: ambient dust ──
      dustRef.current.forEach((d: any) => {
        d.x  += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = 1; if (d.x > 1) d.x = 0;
        if (d.y < 0) d.y = 1; if (d.y > 1) d.y = 0;
        d.op += 0.0008 * d.opDir;
        if (d.op > 0.35 || d.op < 0.05) d.opDir *= -1;
        ctx.fillStyle = `rgba(232,222,181,${d.op.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.size, 0, Math.PI * 2); ctx.fill();
      });

      // ── Vignette ──
      const vignette = ctx.createRadialGradient(W/2, H/2, vaultRad*0.85, W/2, H/2, vaultRad*1.3);
      vignette.addColorStop(0,   "rgba(5,3,10,0)");
      vignette.addColorStop(0.8, "rgba(5,3,10,0.85)");
      vignette.addColorStop(1,   "rgba(5,3,10,1)");
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);

      // ── Sphere rings ──
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(255,50,50,0.4)`;
      ctx.beginPath(); ctx.arc(W/2 + zoom, H/2, vaultRad + 0.5*zoom, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(50,150,255,0.4)`;
      ctx.beginPath(); ctx.arc(W/2 - zoom, H/2, vaultRad - 0.5*zoom, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(${ACCENT_RGB},0.3)`;
      ctx.beginPath(); ctx.arc(W/2, H/2, vaultRad, 0, Math.PI*2); ctx.stroke();

      const glare = ctx.createRadialGradient(W/2 - vaultRad*0.3, H/2 - vaultRad*0.3, 0, W/2 - vaultRad*0.3, H/2 - vaultRad*0.3, vaultRad*0.8);
      glare.addColorStop(0, "rgba(255,255,255,0.03)");
      glare.addColorStop(1, "transparent");
      ctx.fillStyle = glare;
      ctx.beginPath(); ctx.arc(W/2, H/2, vaultRad, 0, Math.PI*2); ctx.fill();

      // ── Lines + nodes + cluster labels ──
      renderQueue.forEach(obj => {
        if (obj.type === "line") {
          const { p1, p2, dist, isReal, linePhase } = obj;
          // proxFactor: shorter projected lines are crisper; long ones fade toward edges
          const maxScreenDist = 300 * p1.scale;
          const proxFactor = Math.max(0.15, 1 - dist / maxScreenDist);
          const depthAlpha = p1.pz < 0 ? 0.12 : 0.55;

          // Slow, independent glimmer per line — peaks at ~0.25 extra opacity
          const glimmer = Math.pow((Math.sin(timeRef.current * 0.018 + linePhase) + 1) / 2, 2);
          const baseAlpha  = proxFactor * depthAlpha * p1.scale;
          const peakAlpha  = baseAlpha + glimmer * 0.22 * proxFactor;

          ctx.save();
          ctx.lineWidth = (0.8 + glimmer * 0.5) * p1.scale;

          if (isReal) {
            // Real-memory lines: pink/rose with glimmer, drawn as gradient
            // so the midpoint can briefly brighten independently
            const mx = (p1.sx2D + p2.sx2D) / 2;
            const my = (p1.sy2D + p2.sy2D) / 2;
            const grad = ctx.createLinearGradient(p1.sx2D, p1.sy2D, p2.sx2D, p2.sy2D);
            const endA   = (baseAlpha * 0.5).toFixed(3);
            const midA   = (peakAlpha).toFixed(3);
            grad.addColorStop(0,   `rgba(236,72,153,${endA})`);
            grad.addColorStop(0.5, `rgba(255,160,200,${midA})`);
            grad.addColorStop(1,   `rgba(236,72,153,${endA})`);
            ctx.strokeStyle = grad;
            ctx.setLineDash([3, 7]);
          } else {
            // Filler lines: subtle silver glimmer
            const midA = (peakAlpha * 0.55).toFixed(3);
            const grad = ctx.createLinearGradient(p1.sx2D, p1.sy2D, p2.sx2D, p2.sy2D);
            grad.addColorStop(0,   `rgba(180,185,210,${(baseAlpha * 0.25).toFixed(3)})`);
            grad.addColorStop(0.5, `rgba(210,215,235,${midA})`);
            grad.addColorStop(1,   `rgba(180,185,210,${(baseAlpha * 0.25).toFixed(3)})`);
            ctx.strokeStyle = grad;
          }

          ctx.beginPath(); ctx.moveTo(p1.sx2D, p1.sy2D); ctx.lineTo(p2.sx2D, p2.sy2D); ctx.stroke();
          ctx.restore();

        } else if (obj.type === "node") {
          const p = obj;
          p.item.phase += p.item.speed;
          const pulse = (Math.sin(p.item.phase) + 1) / 2;

          const isNew = p.isReal && p.item.memory?.id === newNodeIdRef.current;
          let isSel = false, isHov = false;
          if (p.isReal && p.pz > 0) {
            isSel = selected?.id === p.item.memory.id;
            isHov = hovered?.id  === p.item.memory.id;
          }

          const sizeMult = isSel ? 2 : isHov ? 1.5 : isNew ? 1.8 : 1;
          const size     = p.item.baseSize * p.scale * sizeMult;

          // Upgrade #1: decay-based color temperature
          // Upgrade #5: depth fog blend for back-hemisphere nodes
          let alpha = p.pz < -vaultRad*0.5 ? 0.05 : p.pz < 0 ? 0.2 + pulse*0.1 : 0.7 + pulse*0.3;
          let fillR: number, fillG: number, fillB: number;

          if (isNew) {
            [fillR, fillG, fillB] = [232, 222, 181];
            alpha = 0.8 + pulse * 0.2;
          } else if (isSel || isHov) {
            [fillR, fillG, fillB] = [232, 222, 181];
          } else if (p.isReal) {
            const [dr, dg, db] = decayRgb(p.item.memory.decay);
            if (p.pz < 0) {
              // Upgrade #5: blend toward deep fog blue-purple
              const fogT = Math.min(1, Math.abs(p.pz) / (vaultRad * 0.8));
              fillR = Math.round(dr + (80  - dr) * fogT * 0.7);
              fillG = Math.round(dg + (60  - dg) * fogT * 0.7);
              fillB = Math.round(db + (150 - db) * fogT * 0.7);
            } else {
              [fillR, fillG, fillB] = [dr, dg, db];
            }
          } else {
            [fillR, fillG, fillB] = [150, 150, 255];
            alpha *= 0.3;
          }

          ctx.fillStyle = `rgba(${fillR},${fillG},${fillB},${alpha.toFixed(3)})`;
          ctx.beginPath(); ctx.arc(p.sx2D, p.sy2D, size, 0, Math.PI*2); ctx.fill();

          if (isSel || isHov || isNew) {
            ctx.shadowBlur  = (isNew ? 30 : 20) * p.scale;
            ctx.shadowColor = `rgba(${fillR},${fillG},${fillB},1)`;
            ctx.fill();
            ctx.shadowBlur  = 0;
            ctx.strokeStyle = `rgba(${fillR},${fillG},${fillB},1)`; ctx.lineWidth = 1 * p.scale;
            const tSize = 12 * p.scale;
            const rot   = timeRef.current * 0.05;
            ctx.save(); ctx.translate(p.sx2D, p.sy2D); ctx.rotate(rot);
            for (let c = 0; c < 4; c++) {
              ctx.beginPath();
              ctx.moveTo(-tSize, -tSize + tSize/2); ctx.lineTo(-tSize, -tSize); ctx.lineTo(-tSize + tSize/2, -tSize);
              ctx.stroke(); ctx.rotate(Math.PI / 2);
            }
            ctx.restore();
          }


        // Upgrade #2: cluster name label
        } else if (obj.type === "clusterLabel") {
          const fadeIn = Math.min(1, (obj.scale - 0.85) / 0.3);
          ctx.save();
          ctx.globalAlpha = fadeIn * 0.55;
          ctx.font        = `${Math.round(10 * obj.scale)}px monospace`;
          ctx.fillStyle   = `rgba(${ACCENT_RGB},1)`;
          ctx.letterSpacing = "0.15em";
          const lbl = obj.label.toUpperCase();
          const tw  = ctx.measureText(lbl).width;
          ctx.fillText(lbl, obj.sx2D - tw / 2, obj.sy2D - 18 * obj.scale);
          // Small tick line down to cluster centroid
          ctx.strokeStyle = `rgba(${ACCENT_RGB},0.4)`;
          ctx.lineWidth   = 0.5;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(obj.sx2D, obj.sy2D - 14 * obj.scale);
          ctx.lineTo(obj.sx2D, obj.sy2D);
          ctx.stroke();
          ctx.restore();
        }
      });

      // ── Shooting stars ──
      shootingStarsRef.current = shootingStarsRef.current.filter(star => {
        const age = frame - star.born;
        const dur = 55;
        if (age > dur) return false;
        const prog    = age / dur;
        const sx      = star.x * W;
        const sy      = star.y * H;
        const travel  = prog * W * 0.55;
        const ex      = sx - travel * 0.75;
        const ey      = sy + travel * 0.65;
        const op      = prog < 0.2 ? prog / 0.2 : prog > 0.75 ? 1 - (prog - 0.75) / 0.25 : 1;
        const tailLen = 180 * Math.min(1, prog * 4);
        const tx      = ex + tailLen * 0.75;
        const ty      = ey - tailLen * 0.65;

        const grad = ctx.createLinearGradient(tx, ty, ex, ey);
        grad.addColorStop(0,   "transparent");
        grad.addColorStop(0.4, `rgba(232,222,181,${(op*0.4).toFixed(3)})`);
        grad.addColorStop(1,   `rgba(255,255,255,${op.toFixed(3)})`);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ex, ey);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.8; ctx.lineCap = "round"; ctx.stroke();

        const hg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 8);
        hg.addColorStop(0,   `rgba(255,255,255,${op.toFixed(3)})`);
        hg.addColorStop(0.4, `rgba(232,222,181,${(op*0.6).toFixed(3)})`);
        hg.addColorStop(1,   "transparent");
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI*2); ctx.fill();
        return true;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
  }, [selected, hovered, zoom]);

  // Keep the canvas ref in sync when the React toggle changes
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (autoRotate) {
      // Give it a gentle nudge back to life
      vX.current = 0.0005;
      vY.current = 0.001;
    }
  }, [autoRotate]);

  // ─── Pointer handlers ─────────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current  = { x: e.clientX, y: e.clientY };
    lastMouse.current  = { x: e.clientX, y: e.clientY };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      vX.current = (e.clientX - lastMouse.current.x) * 0.002;
      vY.current = (e.clientY - lastMouse.current.y) * 0.002;
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  // Upgrade #9: capture node screen position before opening panel
  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    if (Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y) < 5 && hovered) {
      selectedNodePos.current = { x: e.clientX, y: e.clientY };
      setPanelReady(false);
      setSelected(hovered);
      // Tiny delay so the panel gets the origin before animating in
      requestAnimationFrame(() => setPanelReady(true));
    }
  };

  const panelDecay = selected ? (decays[selected.id] ?? selected.decay) : 0;

  // Upgrade #8: days-ago helper
  const daysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 86400000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05030A]">

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=League+Gothic&display=swap');
        @font-face { font-family: 'Victorian Parlor'; src: url('/fonts/VictorianParlor.ttf') format('truetype'); font-weight: normal; font-style: normal; }
        .font-victorian { font-family: 'Victorian Parlor', serif; }
        .font-gothic    { font-family: 'League Gothic', sans-serif; }
        @keyframes vault-panel-in {
          from { opacity: 0; transform: translateX(var(--panel-origin-x, 60px)); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes img-wipe {
          from { clip-path: inset(100% 0 0 0); }
          to   { clip-path: inset(0% 0 0 0); }
        }
        @keyframes inset-map-open {
          0%   { opacity: 0; transform: scale(0.82) translateY(6px); clip-path: inset(0% 0% 100% 0% round 12px); }
          60%  { clip-path: inset(0% 0% 0%   0% round 12px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);   clip-path: inset(0% 0% 0%   0% round 12px); }
        }
        .panel-enter    { animation: vault-panel-in 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
        .img-wipe       { animation: img-wipe 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .inset-map-card { animation: inset-map-open 0.38s cubic-bezier(0.22,1,0.36,1) forwards; transform-origin: top left; }
      `}</style>

      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-start p-6 md:p-8 pointer-events-none">
        {/* Left: MAHI Portal identity — identical to dashboard header */}
        <div className="flex items-center gap-6 pointer-events-auto">
          <CoreNebula mood={currentMood} />
          <div className="relative flex items-center h-[70px]">
            <Link href="/" className="flex items-center gap-2 drop-shadow-lg">
              <span className="font-gothic text-[56px] tracking-tighter uppercase leading-none text-[#F5F5F0] mt-1.5">MAHI</span>
              <motion.span
                className="font-victorian text-[64px] tracking-tight leading-none transition-colors duration-500"
                animate={{ textShadow: ["0 0 10px var(--accent)", "0 0 40px var(--accent)", "0 0 10px var(--accent)"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                style={{ color: "var(--accent)" }}
              >Portal</motion.span>
            </Link>
          </div>
        </div>
        <div className="pointer-events-auto"><TopControls /></div>
      </header>

      <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}    onPointerCancel={handlePointerUp} />

      {/* ── HUD (upgrades #10, #11, #12) ── */}
      <div className="absolute bottom-8 left-8 pointer-events-none z-40 flex flex-col gap-3">
        <div className="font-mono text-[9px] text-[var(--accent)] tracking-widest uppercase bg-black/50 p-3 rounded backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(232,222,181,0.1)] leading-relaxed">
          Telemetry_Status: {loading ? "SYNCING..." : "ACTIVE"}<br />
          Nodes: {memCount} | Clusters: {Object.keys(clusterNameMap).length}<br />
          Mode: {isDragging.current ? "MANUAL_OVERRIDE" : "ORBITAL_AUTOPILOT"}<br />
          {/* Upgrade #11 */}
          Spin: {spinSpeed.toFixed(3)}°/f<br />
          {/* Upgrade #10: zoom as read-only */}
          Zoom: {Math.round(zoom * 100)}%
        </div>

        {/* Upgrade #12: auto-rotate toggle */}
        <button
          className="pointer-events-auto w-fit px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] rounded border backdrop-blur-md transition-all duration-300"
          style={{
            borderColor: autoRotate ? "rgba(232,222,181,0.4)" : "rgba(255,255,255,0.15)",
            color:       autoRotate ? "rgba(232,222,181,0.9)" : "rgba(255,255,255,0.35)",
            background:  autoRotate ? "rgba(232,222,181,0.06)" : "transparent",
          }}
          onClick={() => setAutoRotate(a => !a)}
        >
          [ AUTO: {autoRotate ? "ON" : "OFF"} ]
        </button>

        {/* Upgrade #10: hint text replacing slider */}
        <div className="font-mono text-[8px] text-white/20 tracking-widest uppercase">
          Scroll to zoom · Drag to rotate
        </div>
      </div>

      {/* ── Inset-map memory popup ── */}
      {selected && panelReady && (
        <div
          key={selected.id}
          className="absolute z-50 pointer-events-auto"
          style={{
            // Anchor to clicked node, nudge so it never bleeds off-screen
            left: Math.min(
              (selectedNodePos.current?.x ?? window.innerWidth / 2) + 24,
              window.innerWidth - 380
            ),
            top: Math.min(
              Math.max((selectedNodePos.current?.y ?? window.innerHeight / 2) - 60, 80),
              window.innerHeight - 520
            ),
            width: 340,
          }}
        >
          {/* Connector tick from node to popup corner */}
          <svg
            className="absolute pointer-events-none"
            style={{ top: 52, left: -24, width: 28, height: 12, overflow: "visible" }}
          >
            <line x1="0" y1="6" x2="24" y2="6"
              stroke="rgba(232,222,181,0.35)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="0" cy="6" r="2" fill="rgba(232,222,181,0.5)" />
          </svg>

          {/* Card */}
          <div
            className="inset-map-card rounded-xl overflow-hidden border border-[var(--accent)]/25 shadow-[0_0_0_1px_rgba(232,222,181,0.06),0_20px_60px_rgba(0,0,0,0.85)]"
            style={{ background: "rgba(7,4,13,0.93)", backdropFilter: "blur(20px)" }}
          >
            {/* Title bar — map header strip */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.03]">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)] animate-pulse" />
                <span className="font-mono text-[8px] text-[var(--accent)] tracking-[0.35em] uppercase">
                  DEC_LOG // NODE
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[7px] text-white/20 tracking-widest uppercase">
                  {daysAgo(selected.date)}d ago
                </span>
                <button
                  onClick={() => { setSelected(null); setPanelReady(false); }}
                  className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-[var(--accent)] hover:bg-white/5 transition-colors font-mono text-[10px]"
                >✕</button>
              </div>
            </div>

            {/* Image — wipe reveal */}
            <div className="relative w-full overflow-hidden bg-black/60" style={{ height: 170 }}>
              <img
                key={selected.id}
                src={selected.thumb}
                alt={selected.title}
                className="w-full h-full object-cover opacity-75 mix-blend-screen contrast-125 saturate-50 img-wipe"
              />
              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.2]"
                style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 1px,#000 1px,#000 2px)" }} />
              {/* Colour tint */}
              <div className="absolute inset-0 bg-[var(--accent)]/8 mix-blend-color-dodge pointer-events-none" />
              {/* Corner reticle marks */}
              {[["top-1 left-1","border-t border-l"],["top-1 right-1","border-t border-r"],
                ["bottom-1 left-1","border-b border-l"],["bottom-1 right-1","border-b border-r"]].map(([pos, bdr]) => (
                <div key={pos} className={`absolute ${pos} w-3 h-3 ${bdr} border-[var(--accent)]/50 pointer-events-none`} />
              ))}
              {/* Title overlay at bottom of image */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#07040D] to-transparent">
                <h3 className="font-black uppercase tracking-tighter text-[#F5F5F0] text-sm leading-none truncate">
                  {selected.title}
                </h3>
              </div>
            </div>

            {/* Metadata row */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-white/[0.06] mt-3">
              <div className="font-mono text-[8px] text-white/40 tracking-widest uppercase">
                {selected.date}
              </div>

              {/* Decay indicator */}
              <div className="flex items-center gap-2">
                <div className="w-[60px] h-[2px] bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${panelDecay * 100}%`,
                      background: dColCss(panelDecay),
                      boxShadow: `0 0 4px ${dColCss(panelDecay)}`,
                    }} />
                </div>
                <span className="font-mono text-[8px] tracking-widest" style={{ color: dColCss(panelDecay) }}>
                  {Math.round(panelDecay * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}