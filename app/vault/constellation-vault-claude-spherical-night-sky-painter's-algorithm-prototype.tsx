"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// --- CONSTELLATION VAULT (with full realtime) ---
export const ConstellationVault = ({
    memories: initialMemories,
    selectedMemory,
    setSelectedMemory,
}: {
    memories: any[];
    selectedMemory: any;
    setSelectedMemory: (m: any) => void;
}) => {
    const [memories, setMemories] = useState<any[]>(initialMemories);
    const [constellationPath, setConstellationPath] = useState<string[]>([]);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [newNodeId, setNewNodeId] = useState<string | null>(null); // tracks freshly-arrived node for animation
    const prevMemoryIds = useRef<Set<string>>(new Set(initialMemories.map((m) => m.id)));

    // Sync if parent re-fetches on mount
    useEffect(() => {
        setMemories(initialMemories);
        prevMemoryIds.current = new Set(initialMemories.map((m) => m.id));
    }, [initialMemories]);

    // ── REALTIME SUBSCRIPTION ─────────────────────────────────────────────────
    useEffect(() => {
        const channel = supabase
            .channel('vault-realtime')
            // 1. New memory inserted → add node + animate it in
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'memories' },
                (payload) => {
                    const newMem = payload.new as any;
                    if (prevMemoryIds.current.has(newMem.id)) return;
                    prevMemoryIds.current.add(newMem.id);

                    setMemories((prev) => [newMem, ...prev]);
                    setNewNodeId(newMem.id);
                    // Auto-select new memory so both sessions instantly see it
                    setSelectedMemory(newMem);
                    // Clear the "new" glow after the intro animation
                    setTimeout(() => setNewNodeId(null), 3000);
                }
            )
            // 2. Memory deleted → remove node
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'memories' },
                (payload) => {
                    const deletedId = payload.old?.id;
                    if (!deletedId) return;
                    prevMemoryIds.current.delete(deletedId);
                    setMemories((prev) => prev.filter((m) => m.id !== deletedId));
                    setConstellationPath((prev) => prev.filter((id) => id !== deletedId));
                    setSelectedMemory((prev: any) =>
                        prev?.id === deletedId ? null : prev
                    );
                }
            )
            // 3. Memory updated → refresh in-place
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'memories' },
                (payload) => {
                    const updated = payload.new as any;
                    setMemories((prev) =>
                        prev.map((m) => (m.id === updated.id ? updated : m))
                    );
                    setSelectedMemory((prev: any) =>
                        prev?.id === updated.id ? updated : prev
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [setSelectedMemory]);

    // ── MAP LAYOUT ────────────────────────────────────────────────────────────
    const mappedMemories = useMemo(() => {
        if (!memories || memories.length === 0) return [];
        const sorted = [...memories].sort(
            (a, b) =>
                new Date(a.memory_date).getTime() -
                new Date(b.memory_date).getTime()
        );
        const total = sorted.length;
        const cols = Math.ceil(Math.sqrt(total));
        return sorted.map((mem, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const xBase = (col + 0.5) * (100 / cols);
            const yBase =
                (row + 0.5) * (100 / Math.ceil(total / cols));
            const jitterX = Math.sin(i * 13) * 12;
            const jitterY = Math.cos(i * 17) * 12;
            const x = Math.max(8, Math.min(92, xBase + jitterX));
            const y = Math.max(8, Math.min(92, yBase + jitterY));
            return { ...mem, x, y, chronologicalIndex: i + 1 };
        });
    }, [memories]);

    // ── INTERACTIONS ──────────────────────────────────────────────────────────
    const handleNodeClick = (mem: any) => {
        setSelectedMemory(mem);
        if (!constellationPath.includes(mem.id)) {
            setConstellationPath((prev) => [...prev, mem.id]);
        } else {
            const idx = constellationPath.indexOf(mem.id);
            setConstellationPath(constellationPath.slice(0, idx + 1));
        }
    };

    const handleTraceTimeline = (e: React.MouseEvent) => {
        e.stopPropagation();
        const allIds = mappedMemories.map((m) => m.id);
        setConstellationPath(allIds);
        if (mappedMemories.length > 0)
            setSelectedMemory(mappedMemories[mappedMemories.length - 1]);
    };

    const handleClearTrace = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConstellationPath([]);
    };

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="h-full w-full flex relative overflow-hidden bg-[#05030A] rounded-[inherit]">

            {/* ── RADAR / MAP PANEL ── */}
            <motion.div
                className="h-full relative border-r border-white/5 shadow-[inset_-20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden shrink-0 z-30 will-change-[width] group/map"
                animate={{ width: isMapExpanded ? '60%' : '60px' }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                onMouseEnter={() => setIsMapExpanded(true)}
                onMouseLeave={() => setIsMapExpanded(false)}
            >
                {/* Collapsed label */}
                <AnimatePresence>
                    {!isMapExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] border-r border-[var(--accent)]/30 cursor-crosshair hover:bg-white/5 transition-colors"
                        >
                            <span className="font-mono text-[9px] text-[var(--accent)] tracking-[0.4em] uppercase [writing-mode:vertical-lr] rotate-180 flex items-center gap-4">
                                <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" />
                                RADAR // STANDBY
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Map background + radar sweep */}
                <motion.div
                    animate={{ opacity: isMapExpanded ? 1 : 0 }}
                    className="absolute inset-0 pointer-events-none"
                >
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                            backgroundPosition: 'center center',
                        }}
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute top-1/2 left-1/2 w-[150%] h-[150%] origin-top-left z-0"
                        style={{
                            background:
                                'conic-gradient(from 0deg, transparent 70%, rgba(232, 222, 181, 0.05) 100%)',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />

                    {/* Constellation lines */}
                    <svg className="absolute inset-0 w-full h-full z-10 overflow-visible">
                        {constellationPath.length > 1 &&
                            constellationPath.map((id, index) => {
                                if (index === 0) return null;
                                const prevId = constellationPath[index - 1];
                                const startNode = mappedMemories.find(
                                    (m) => m.id === prevId
                                );
                                const endNode = mappedMemories.find(
                                    (m) => m.id === id
                                );
                                if (!startNode || !endNode) return null;
                                return (
                                    <motion.line
                                        key={`line-${prevId}-${id}`}
                                        x1={`${startNode.x}%`}
                                        y1={`${startNode.y}%`}
                                        x2={`${endNode.x}%`}
                                        y2={`${endNode.y}%`}
                                        stroke="var(--accent)"
                                        strokeWidth="2"
                                        strokeOpacity="0.6"
                                        strokeDasharray="4 4"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                                    />
                                );
                            })}
                    </svg>
                </motion.div>

                {/* Interactive node layer */}
                <motion.div
                    animate={{ opacity: isMapExpanded ? 1 : 0 }}
                    className="absolute inset-0 pointer-events-auto z-20"
                >
                    {/* Toolbar */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                        <div className="font-mono text-[9px] text-[var(--accent)] tracking-widest uppercase bg-black/50 p-2 rounded backdrop-blur-md border border-white/10 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" />
                            Nodes_Detected: {mappedMemories.length}
                        </div>
                        <div className="flex gap-2 pointer-events-auto">
                            <button
                                onClick={handleClearTrace}
                                className="px-3 py-1.5 bg-black/60 border border-white/20 text-white/50 hover:text-white text-[8px] font-mono tracking-[0.2em] rounded backdrop-blur-md transition-colors uppercase"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleTraceTimeline}
                                className="px-3 py-1.5 bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black text-[8px] font-mono font-bold tracking-[0.2em] rounded backdrop-blur-md transition-colors uppercase shadow-[0_0_10px_var(--accent)]"
                            >
                                Trace Timeline
                            </button>
                        </div>
                    </div>

                    {/* Nodes — AnimatePresence handles enter/exit */}
                    <AnimatePresence>
                        {mappedMemories.map((mem) => {
                            const isSelected = selectedMemory?.id === mem.id;
                            const isInPath = constellationPath.includes(mem.id);
                            const isNew = newNodeId === mem.id;

                            return (
                                <motion.button
                                    key={mem.id}
                                    // Pop in when brand-new, fade out if deleted
                                    initial={isNew ? { scale: 0, opacity: 0 } : false}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={
                                        isNew
                                            ? { type: 'spring', stiffness: 300, damping: 18 }
                                            : { duration: 0.3 }
                                    }
                                    onClick={() => handleNodeClick(mem)}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 outline-none group"
                                    style={{ left: `${mem.x}%`, top: `${mem.y}%` }}
                                >
                                    {/* Pulse ring */}
                                    {(isSelected || isInPath || isNew) && (
                                        <motion.div
                                            animate={{
                                                scale: [1, isNew ? 4 : 2.5, 1],
                                                opacity: [0.5, 0, 0.5],
                                            }}
                                            transition={{
                                                duration: isNew ? 1.2 : 2,
                                                repeat: Infinity,
                                            }}
                                            className="absolute inset-0 m-auto w-6 h-6 rounded-full pointer-events-none"
                                            style={{
                                                backgroundColor: isNew
                                                    ? '#fff'
                                                    : 'var(--accent)',
                                            }}
                                        />
                                    )}

                                    {/* Dot */}
                                    <div
                                        className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                                            isNew
                                                ? 'bg-white scale-150 shadow-[0_0_20px_4px_white]'
                                                : isSelected
                                                ? 'bg-white shadow-[0_0_15px_var(--accent)] scale-150'
                                                : isInPath
                                                ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]'
                                                : 'bg-white/20 hover:bg-white/60 hover:scale-125'
                                        }`}
                                    />

                                    {/* Tooltip */}
                                    <div
                                        className={`absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[8px] tracking-[0.2em] whitespace-nowrap transition-all duration-300 pointer-events-none z-50 ${
                                            isSelected
                                                ? 'opacity-100 translate-x-0'
                                                : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                                        }`}
                                    >
                                        {isSelected ? (
                                            <span className="text-[var(--accent)]">ACTIVE_NODE</span>
                                        ) : (
                                            <div className="bg-black/80 border border-[var(--accent)]/30 p-2 rounded-sm backdrop-blur-md shadow-[0_5px_15px_rgba(0,0,0,0.8)] flex flex-col gap-1">
                                                <span className="text-[var(--accent)] border-b border-white/10 pb-1">
                                                    {new Date(mem.memory_date)
                                                        .toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                        })
                                                        .replace(/\//g, '.')}
                                                </span>
                                                <span className="text-white/80 uppercase truncate max-w-[150px]">
                                                    {mem.title}
                                                    {isNew && (
                                                        <span className="ml-1 text-white animate-pulse">
                                                            ✦ NEW
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* ── DETAIL PANEL ── */}
            <div className="h-full bg-[#030205] relative z-20 flex flex-col flex-1 min-w-0">

                {/* "NEW MEMORY LOGGED" toast */}
                <AnimatePresence>
                    {newNodeId && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black/70 backdrop-blur-md border border-[var(--accent)]/60 font-mono text-[9px] tracking-[0.3em] uppercase text-[var(--accent)] shadow-[0_0_20px_var(--accent)] flex items-center gap-2 pointer-events-none"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                            NEW MEMORY NODE DETECTED
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {selectedMemory ? (
                        <motion.div
                            key={selectedMemory.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.35 }}
                            className="flex flex-col h-full relative p-6 md:p-10 overflow-hidden"
                        >
                            <div
                                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                                style={{
                                    background:
                                        'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)',
                                }}
                            />

                            <header className="shrink-0 mb-4 z-10 flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-3 gap-3">
                                <div className="flex flex-col gap-2">
                                    <div className="font-mono text-[9px] text-[var(--accent)] tracking-[0.3em] uppercase flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_5px_var(--accent)]" />
                                        DEC_LOG //{' '}
                                        {String(selectedMemory.chronologicalIndex ?? '???').padStart(3, '0')}
                                        {newNodeId === selectedMemory.id && (
                                            <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[8px] animate-pulse">
                                                JUST LOGGED
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[#F5F5F0] leading-none drop-shadow-md truncate max-w-[400px]">
                                        {selectedMemory.title}
                                    </h2>
                                </div>
                                <div className="font-mono text-[9px] text-white/50 tracking-[0.2em] flex items-center gap-2">
                                    <span className="opacity-50">T-STAMP:</span>
                                    {new Date(selectedMemory.memory_date)
                                        .toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                        })
                                        .replace(/\//g, '.')}
                                </div>
                            </header>

                            <div className="flex-1 flex flex-col gap-6 overflow-hidden relative z-10">
                                {selectedMemory.image_url && (
                                    <div
                                        className="relative w-full flex-1 shrink-0 flex flex-col items-center justify-center z-20 min-h-0 pb-8"
                                        style={{ perspective: '1000px' }}
                                    >
                                        <motion.div
                                            animate={{ y: [-3, 3, -3] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 6,
                                                ease: 'easeInOut',
                                            }}
                                            className="relative w-full h-full min-h-0 z-20 bg-transparent flex items-center justify-center"
                                            style={{
                                                transformStyle: 'preserve-3d',
                                                transform: 'rotateX(3deg)',
                                            }}
                                        >
                                            <div className="relative w-full h-full max-w-2xl border-[0.5px] border-[var(--accent)]/30 bg-[#000000]/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_20px_var(--accent)] overflow-hidden rounded-md group">
                                                <img
                                                    src={selectedMemory.image_url}
                                                    alt={selectedMemory.title}
                                                    className="w-full h-full object-contain relative z-10 p-1 opacity-90 contrast-125 saturate-50 mix-blend-screen filter drop-shadow-[0_0_8px_var(--accent)]"
                                                />
                                                <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-color-dodge z-20 pointer-events-none" />
                                                <div
                                                    className="absolute inset-0 pointer-events-none z-30 opacity-[0.25]"
                                                    style={{
                                                        background:
                                                            'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)',
                                                    }}
                                                />
                                                <div
                                                    className="absolute inset-0 pointer-events-none z-30 opacity-[0.05]"
                                                    style={{
                                                        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                                                        backgroundSize: '4px 4px',
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#000_120%)] z-40 pointer-events-none" />
                                            </div>
                                            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                        </motion.div>
                                        <div
                                            className="absolute bottom-6 w-[80%] max-w-lg h-[40%] z-10 pointer-events-none origin-bottom opacity-40 mix-blend-screen"
                                            style={{
                                                background:
                                                    'linear-gradient(to top, var(--accent) 0%, transparent 100%)',
                                                clipPath:
                                                    'polygon(20% 100%, 80% 100%, 100% 0%, 0% 0%)',
                                                filter: 'blur(12px)',
                                            }}
                                        />
                                        <div className="absolute bottom-3 w-[60%] max-w-md h-[8px] bg-[#0a0a0a] border border-[#222] rounded-[100%] shadow-[0_10px_20px_rgba(0,0,0,0.9)] z-0 flex items-center justify-center">
                                            <div className="w-[80%] h-[2px] bg-[var(--accent)] rounded-[100%] shadow-[0_0_15px_var(--accent),0_0_30px_var(--accent)] blur-[1px]" />
                                            <div className="absolute w-[30%] h-[2px] bg-white rounded-[100%] shadow-[0_0_10px_white] blur-[0.5px]" />
                                        </div>
                                    </div>
                                )}
                                <div className="shrink-0 max-h-[35%] overflow-y-auto custom-scroll pr-4 pb-2">
                                    <p className="text-[#F5F5F0]/80 text-xs md:text-sm leading-relaxed font-mono uppercase tracking-widest">
                                        {selectedMemory.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-12 h-full flex flex-col items-center justify-center opacity-30 text-center"
                        >
                            <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mb-6">
                                <span className="font-mono text-xl">?</span>
                            </div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.3em]">
                                Hover Radar to deploy.
                                <br />
                                Select a node to decrypt.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ConstellationVault;