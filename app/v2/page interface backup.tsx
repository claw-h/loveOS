"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import CelestialEvents from '@/components/CelestialEvents';
import TopControls from '@/components/TopControls';

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const START_DATE = new Date("2023-01-01"); 
const charMap: Record<string, string> = { 'a':'❤️','b':'💖','c':'💗','d':'💓','e':'💞','f':'💕','g':'💌','h':'💘','i':'💝','j':'💟','k':'❤️‍🔥','l':'🏩','m':'💒','n':'👰','o':'💍','p':'💎','q':'🌹','r':'🌷','s':'🌻','t':'🌼','u':'🎈','v':'🎁','w':'🎀','x':'🧸','y':'✨','z':'🌟',' ':'  ' };

const moods = [
    { label: "OPTIMAL", color: "#F59E0B", emoji: "✧", message: "All systems nominal." }, 
    { label: "ANXIOUS", color: "#A78BFA", emoji: "≈", message: "Running background defrag." }, 
    { label: "LOW POWER", color: "#D4D4D8", emoji: "☾", message: "Battery depleted. Resting." }, 
    { label: "CRITICAL", color: "#DC2626", emoji: "⚠", message: "Core overheat. Hugs required." }, 
    { label: "MISSING_ADMIN", color: "#14B8A6", emoji: "⍙", message: "Searching for connection..." } 
];

type TabId = 'uptime' | 'directive' | 'comm' | 'vault';

const TABS: { id: TabId; title: string; subtitle: string; icon: string }[] = [
    { id: 'uptime', title: 'CORE_UPTIME', subtitle: 'System Status', icon: '✦' },
    { id: 'directive', title: 'DIRECTIVE', subtitle: 'Current Policy', icon: '■' },
    { id: 'comm', title: 'SECURE_COMM', subtitle: 'Encrypted Link', icon: '▲' },
    { id: 'vault', title: 'MEMORY_VAULT', subtitle: 'Archived Logs', icon: '●' },
];

const getOrbEmoji = (id: string) => {
    const orbs = ['✦', '⟡', '⍙', '≈', '☾', '✧'];
    const charCode = id.charCodeAt(id.length - 1) || 0;
    return orbs[charCode % orbs.length];
};

const ScrambleText = ({ text, isDecrypting }: { text: string, isDecrypting: boolean }) => {
    const [display, setDisplay] = useState(text);
    const chars = "!<>-_\\\\/[]{}—=+*^?#________";
    
    useEffect(() => {
        if (!isDecrypting) return;
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplay(text.split("").map((letter, index) => {
                if (index < iteration) return letter;
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(""));
            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    }, [isDecrypting, text]);

    return <span>{isDecrypting ? display : text}</span>;
};

// --- HIGH-PERFORMANCE CANVAS WARP ENGINE ---
const OrganicStars = ({ isWarp }: { isWarp?: boolean }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const stars = React.useRef<any[]>([]);
    const animationFrame = React.useRef<number>(0);

    useEffect(() => {
        stars.current = Array.from({ length: 140 }).map(() => ({
            x: Math.random() * 2000 - 1000,
            y: Math.random() * 2000 - 1000,
            z: Math.random() * 2000,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random(),
            fadeDir: Math.random() > 0.5 ? 1 : -1
        }));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const w = canvas.width = window.innerWidth;
            const h = canvas.height = window.innerHeight;
            const centerX = w / 2;
            const centerY = h / 2;

            ctx.clearRect(0, 0, w, h);
            
            stars.current.forEach(star => {
                if (isWarp) {
                    star.z -= 40; 
                    if (star.z <= 1) star.z = 2000;
                } else {
                    star.z -= 0.5; 
                    if (star.z <= 1) star.z = 2000;
                    star.opacity += 0.01 * star.fadeDir;
                    if (star.opacity >= 1 || star.opacity <= 0.2) star.fadeDir *= -1;
                }

                const k = 128 / star.z;
                const px = star.x * k + centerX;
                const py = star.y * k + centerY;

                if (px >= 0 && px <= w && py >= 0 && py <= h) {
                    const s = star.size * k;
                    ctx.beginPath();
                    if (isWarp) {
                        const prevK = 128 / (star.z + 100); 
                        const ppx = star.x * prevK + centerX;
                        const ppy = star.y * prevK + centerY;
                        ctx.moveTo(px, py);
                        ctx.lineTo(ppx, ppy);
                        ctx.strokeStyle = `rgba(232, 222, 181, ${star.opacity})`;
                        ctx.lineWidth = s;
                        ctx.lineCap = 'round';
                        ctx.stroke();
                    } else {
                        ctx.arc(px, py, s, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(232, 222, 181, ${star.opacity})`;
                        ctx.fill();
                    }
                }
            });

            animationFrame.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame.current!);
    }, [isWarp]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 z-0 pointer-events-none w-full h-full will-change-transform"
            style={{ filter: isWarp ? 'blur(0.5px) contrast(1.2)' : 'none' }}
        />
    );
};

// --- WIDE HANGAR COMMAND RACK ---
const CommandRack = ({ activeTab, setActiveTab }: { activeTab: TabId | null, setActiveTab: (t: TabId) => void }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div 
            className="fixed left-0 top-0 h-full w-[280px] z-[100] flex items-center will-change-transform"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ x: isHovered ? 0 : -280 }} 
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-[24px] h-[140px] cursor-crosshair flex items-center group pointer-events-auto">
                <motion.div 
                    animate={{ 
                        backgroundColor: isHovered ? 'rgba(255,255,255,0)' : 'rgba(10,10,10,0.95)',
                        borderColor: isHovered ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.1)'
                    }}
                    className="w-[18px] h-full rounded-r-[8px] border-y border-r flex flex-col items-center justify-center gap-[6px] backdrop-blur-md shadow-[5px_0_15px_rgba(0,0,0,0.6)] transition-colors duration-300"
                >
                    <div className="w-[2px] h-[12px] bg-white/20 rounded-full" />
                    <div className="w-[2px] h-[12px] bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)] animate-pulse" />
                    <div className="w-[2px] h-[12px] bg-white/20 rounded-full" />
                </motion.div>
            </div>

            <div className="w-full h-[560px] bg-[#0a0a0a] border-y border-r border-white/10 flex flex-col justify-center px-6 gap-4 shadow-[30px_0_80px_rgba(0,0,0,0.9)] rounded-r-3xl relative overflow-visible">
                <div className="absolute inset-0 opacity-15 pointer-events-none rounded-r-3xl" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                
                <div className="font-mono text-[9px] text-white/40 tracking-[0.4em] uppercase mb-4 px-2">Navigation</div>

                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative flex items-center gap-5 w-full text-left group/btn outline-none p-2 rounded-xl transition-colors hover:bg-white/5">
                            <div className="w-14 h-14 relative shrink-0" style={{ perspective: "800px" }}>
                                <motion.div animate={{ z: isActive ? 20 : 0, rotateY: isActive ? 0 : -20, scale: isActive ? 1.1 : 0.95 }} transition={{ type: "spring", stiffness: 350, damping: 20 }} className={`absolute inset-0 flex items-center justify-center rounded-lg border transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-[#1a1a1a] to-[#050505] border-[var(--accent)] shadow-[0_0_20px_var(--accent)]' : 'bg-[#111] border-white/10 opacity-60'}`}>
                                    <span className={`text-xl ${isActive ? 'text-[var(--accent)] drop-shadow-[0_0_8px_var(--accent)]' : 'text-white/40'}`}>{tab.icon}</span>
                                    {isActive && <div className="absolute right-[-4px] top-0 w-[4px] h-full bg-[#050505] transform origin-left rotate-y-90" />}
                                </motion.div>
                            </div>
                            
                            <div className="flex flex-col">
                                <span className={`font-mono text-[11px] font-black tracking-[0.2em] uppercase transition-colors ${isActive ? 'text-[var(--accent)] drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'text-white/60 group-hover/btn:text-white'}`}>{tab.title}</span>
                                <span className="font-mono text-[8px] text-white/30 tracking-widest mt-1 uppercase">{tab.subtitle}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
};

// --- FUNCTIONAL CONSTELLATION VAULT ---
const ConstellationVault = ({ memories, selectedMemory, setSelectedMemory }: { memories: any[], selectedMemory: any, setSelectedMemory: (m: any) => void }) => {
    const [constellationPath, setConstellationPath] = useState<string[]>([]);
    const [isMapExpanded, setIsMapExpanded] = useState(false); 

    const mappedMemories = useMemo(() => {
        if (!memories || memories.length === 0) return [];
        const sorted = [...memories].sort((a, b) => new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime());
        const total = sorted.length;
        const cols = Math.ceil(Math.sqrt(total));
        return sorted.map((mem, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const xBase = (col + 0.5) * (100 / cols);
            const yBase = (row + 0.5) * (100 / Math.ceil(total / cols));
            const jitterX = Math.sin(i * 13) * 12; 
            const jitterY = Math.cos(i * 17) * 12;
            const x = Math.max(8, Math.min(92, xBase + jitterX));
            const y = Math.max(8, Math.min(92, yBase + jitterY));
            return { ...mem, x, y, chronologicalIndex: i + 1 };
        });
    }, [memories]);

    const handleNodeClick = (mem: any) => {
        setSelectedMemory(mem);
        if (!constellationPath.includes(mem.id)) {
            setConstellationPath(prev => [...prev, mem.id]);
        } else {
            const idx = constellationPath.indexOf(mem.id);
            setConstellationPath(constellationPath.slice(0, idx + 1));
        }
    };

    const handleTraceTimeline = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        const allIds = mappedMemories.map(m => m.id);
        setConstellationPath(allIds);
        if (mappedMemories.length > 0) setSelectedMemory(mappedMemories[mappedMemories.length - 1]);
    };

    const handleClearTrace = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConstellationPath([]);
    };

    return (
        <div className="h-full w-full flex relative overflow-hidden bg-[#05030A] rounded-[inherit]">
            <motion.div 
                className="h-full relative border-r border-white/5 shadow-[inset_-20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden shrink-0 z-30 will-change-[width] group/map"
                animate={{ width: isMapExpanded ? '60%' : '60px' }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                onMouseEnter={() => setIsMapExpanded(true)}
                onMouseLeave={() => setIsMapExpanded(false)}
            >
                <AnimatePresence>
                    {!isMapExpanded && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] border-r border-[var(--accent)]/30 cursor-crosshair hover:bg-white/5 transition-colors">
                            <span className="font-mono text-[9px] text-[var(--accent)] tracking-[0.4em] uppercase [writing-mode:vertical-lr] rotate-180 flex items-center gap-4">
                                <span className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" />
                                RADAR // STANDBY
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div animate={{ opacity: isMapExpanded ? 1 : 0 }} className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '40px 40px', backgroundPosition: 'center center' }} />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 left-1/2 w-[150%] h-[150%] origin-top-left z-0" style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(232, 222, 181, 0.05) 100%)', transform: 'translate(-50%, -50%)' }} />
                    <svg className="absolute inset-0 w-full h-full z-10 overflow-visible">
                        {constellationPath.length > 1 && constellationPath.map((id, index) => {
                            if (index === 0) return null;
                            const prevId = constellationPath[index - 1];
                            const startNode = mappedMemories.find(m => m.id === prevId);
                            const endNode = mappedMemories.find(m => m.id === id);
                            if (!startNode || !endNode) return null;
                            return (
                                <motion.line 
                                    key={`line-${prevId}-${id}`} x1={`${startNode.x}%`} y1={`${startNode.y}%`} x2={`${endNode.x}%`} y2={`${endNode.y}%`}
                                    stroke="var(--accent)" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 4"
                                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.8, ease: "easeInOut" }}
                                />
                            );
                        })}
                    </svg>
                </motion.div>

                <motion.div animate={{ opacity: isMapExpanded ? 1 : 0 }} className="absolute inset-0 pointer-events-auto z-20">
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                        <div className="font-mono text-[9px] text-[var(--accent)] tracking-widest uppercase bg-black/50 p-2 rounded backdrop-blur-md border border-white/10">
                            Nodes_Detected: {mappedMemories.length}
                        </div>
                        <div className="flex gap-2 pointer-events-auto">
                            <button onClick={handleClearTrace} className="px-3 py-1.5 bg-black/60 border border-white/20 text-white/50 hover:text-white text-[8px] font-mono tracking-[0.2em] rounded backdrop-blur-md transition-colors uppercase">Clear</button>
                            <button onClick={handleTraceTimeline} className="px-3 py-1.5 bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black text-[8px] font-mono font-bold tracking-[0.2em] rounded backdrop-blur-md transition-colors uppercase shadow-[0_0_10px_var(--accent)]">Trace Timeline</button>
                        </div>
                    </div>

                    {mappedMemories.map((mem) => {
                        const isSelected = selectedMemory?.id === mem.id;
                        const isInPath = constellationPath.includes(mem.id);
                        return (
                            <button key={mem.id} onClick={() => handleNodeClick(mem)} className="absolute transform -translate-x-1/2 -translate-y-1/2 outline-none group" style={{ left: `${mem.x}%`, top: `${mem.y}%` }}>
                                {(isSelected || isInPath) && <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-[var(--accent)] pointer-events-none" />}
                                <div className={`relative w-3 h-3 rounded-full transition-all duration-300 ${isSelected ? 'bg-white shadow-[0_0_15px_var(--accent)] scale-150' : isInPath ? 'bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]' : 'bg-white/20 hover:bg-white/60 hover:scale-125'}`} />
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[8px] tracking-[0.2em] whitespace-nowrap transition-all duration-300 pointer-events-none z-50 ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                                    {isSelected ? (
                                        <span className="text-[var(--accent)]">ACTIVE_NODE</span>
                                    ) : (
                                        <div className="bg-black/80 border border-[var(--accent)]/30 p-2 rounded-sm backdrop-blur-md shadow-[0_5px_15px_rgba(0,0,0,0.8)] flex flex-col gap-1">
                                            <span className="text-[var(--accent)] border-b border-white/10 pb-1">{new Date(mem.memory_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}</span>
                                            <span className="text-white/80 uppercase truncate max-w-[150px]">{mem.title}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </motion.div>
            </motion.div>

            <div className="h-full bg-[#030205] relative z-20 flex flex-col flex-1 min-w-0">
                {selectedMemory ? (
                    <motion.div key={selectedMemory.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full relative p-6 md:p-10 overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)' }} />
                        <header className="shrink-0 mb-4 z-10 flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-3 gap-3">
                            <div className="flex flex-col gap-2">
                                <div className="font-mono text-[9px] text-[var(--accent)] tracking-[0.3em] uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_5px_var(--accent)]" />
                                    DEC_LOG // {String(selectedMemory.chronologicalIndex).padStart(3, '0')}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[#F5F5F0] leading-none drop-shadow-md truncate max-w-[400px]">{selectedMemory.title}</h2>
                            </div>
                            <div className="font-mono text-[9px] text-white/50 tracking-[0.2em] flex items-center gap-2">
                                <span className="opacity-50">T-STAMP:</span> 
                                {new Date(selectedMemory.memory_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                            </div>
                        </header>

                        <div className="flex-1 flex flex-col gap-6 overflow-hidden relative z-10">
                            {selectedMemory.image_url && (
                                <div className="relative w-full flex-1 shrink-0 flex flex-col items-center justify-center z-20 min-h-0 pb-8" style={{ perspective: "1000px" }}>
                                    <motion.div animate={{ y: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="relative w-full h-full min-h-0 z-20 bg-transparent flex items-center justify-center" style={{ transformStyle: "preserve-3d", transform: "rotateX(3deg)" }}>
                                        <div className="relative w-full h-full max-w-2xl border-[0.5px] border-[var(--accent)]/30 bg-[#000000]/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_20px_var(--accent)] overflow-hidden rounded-md group">
                                            <img src={selectedMemory.image_url} alt={selectedMemory.title} className="w-full h-full object-contain relative z-10 p-1 opacity-90 contrast-125 saturate-50 mix-blend-screen filter drop-shadow-[0_0_8px_var(--accent)]" />
                                            <div className="absolute inset-0 bg-[var(--accent)]/10 mix-blend-color-dodge z-20 pointer-events-none" />
                                            <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.25]" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)' }} />
                                            <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '4px 4px' }} />
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#000_120%)] z-40 pointer-events-none" />
                                        </div>
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[var(--accent)] pointer-events-none z-50 opacity-70" />
                                    </motion.div>
                                    <div className="absolute bottom-6 w-[80%] max-w-lg h-[40%] z-10 pointer-events-none origin-bottom opacity-40 mix-blend-screen" style={{ background: 'linear-gradient(to top, var(--accent) 0%, transparent 100%)', clipPath: 'polygon(20% 100%, 80% 100%, 100% 0%, 0% 0%)', filter: 'blur(12px)' }} />
                                    <div className="absolute bottom-3 w-[60%] max-w-md h-[8px] bg-[#0a0a0a] border border-[#222] rounded-[100%] shadow-[0_10px_20px_rgba(0,0,0,0.9)] z-0 flex items-center justify-center">
                                        <div className="w-[80%] h-[2px] bg-[var(--accent)] rounded-[100%] shadow-[0_0_15px_var(--accent),0_0_30px_var(--accent)] blur-[1px]" />
                                        <div className="absolute w-[30%] h-[2px] bg-white rounded-[100%] shadow-[0_0_10px_white] blur-[0.5px]" />
                                    </div>
                                </div>
                            )}
                            <div className="shrink-0 max-h-[35%] overflow-y-auto custom-scroll pr-4 pb-2">
                                <p className="text-[#F5F5F0]/80 text-xs md:text-sm leading-relaxed font-mono uppercase tracking-widest">{selectedMemory.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="p-12 h-full flex flex-col items-center justify-center opacity-30 text-center">
                        <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mb-6"><span className="font-mono text-xl">?</span></div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Hover Radar to deploy.<br/>Select a node to decrypt.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ATMOSPHERIC CARD ---
function AtmosphericCard({ children, layoutId, onClick, className = "", isExpanded = false, moodFlash = 0, bgClass = "bg-black/30 backdrop-blur-xl border-white/[0.08]" }: any) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
    const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });
    const tiltRange = isExpanded ? 1.5 : 5; 
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${tiltRange}deg`, `-${tiltRange}deg`]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${tiltRange}deg`, `${tiltRange}deg`]);
    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    }
    function handleMouseLeave() { x.set(0); y.set(0); mouseX.set(-1000); mouseY.set(-1000); }

    return (
        <motion.div layoutId={layoutId} style={{ perspective: 1500 }} className={`relative z-10 group ${className}`} onClick={onClick}>
            <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={`w-full h-full rounded-[2rem] ${bgClass} shadow-[0_20px_50px_rgba(0,0,0,0.5)] border overflow-hidden transition-all duration-300 flex flex-col will-change-transform ${onClick ? 'cursor-pointer' : ''}`}>
                <motion.div key={`bezel-${moodFlash}`} initial={{ opacity: 0 }} animate={{ opacity: moodFlash > 0 ? [0, 0.5, 0] : 0 }} transition={{ duration: 4, ease: "easeOut" }} className="absolute inset-0 rounded-[2rem] border-2 pointer-events-none z-20" style={{ borderColor: 'var(--accent)', boxShadow: 'inset 0 0 20px var(--accent)' }} />
                <motion.div style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }} className="pointer-events-none absolute w-[600px] h-[600px] rounded-full bg-[#E8DEB5] opacity-0 group-hover:opacity-[0.12] blur-[80px] transition-opacity duration-300 z-0" />
                <div style={{ transform: "translateZ(20px)" }} className="w-full h-full relative z-10 flex flex-col">{children}</div>
            </motion.div>
        </motion.div>
    );
}

// --- THE MOOD NEBULA CORE ---
const CoreNebula = ({ mood }: { mood: typeof moods[0] }) => {
    const getPhysics = () => {
        switch(mood.label) {
            case "OPTIMAL": return { speed1: 12, speed2: 8, pulse: [0.9, 1.1, 0.9], coreGlow: '0 0 20px 8px' };
            case "ANXIOUS": return { speed1: 2, speed2: 1.5, pulse: [0.8, 1.4, 0.7, 1.3], coreGlow: '0 0 30px 12px' };
            case "LOW POWER": return { speed1: 30, speed2: 40, pulse: [0.95, 1.05, 0.95], coreGlow: '0 0 10px 2px' };
            case "CRITICAL": return { speed1: 0.8, speed2: 1.2, pulse: [1, 1.6, 1], coreGlow: '0 0 40px 15px' };
            default: return { speed1: 12, speed2: 8, pulse: [1, 1, 1], coreGlow: '0 0 20px 8px' };
        }
    };
    const physics = getPhysics();

    return (
        <div className="relative w-[70px] h-[70px] rounded-full p-[3px] bg-[#161616] shadow-[0_15px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#2a2a2a] shrink-0">
            <div className="relative w-full h-full rounded-full bg-[#020202] shadow-[inset_0_6px_20px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center border border-black">
                <div className="absolute inset-0 opacity-50 mix-blend-screen pointer-events-none z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: physics.speed1, repeat: Infinity, ease: "linear" }} className="absolute w-[85%] h-[85%] rounded-full border-[2px] border-dashed border-white/10 z-10 will-change-transform" style={{ borderTopColor: 'var(--accent)', borderBottomColor: 'var(--accent)' }} />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: physics.speed2, repeat: Infinity, ease: "linear" }} className="absolute w-[60%] h-[60%] rounded-full border border-transparent z-10 will-change-transform" style={{ borderLeftColor: 'var(--accent)', borderRightColor: 'var(--accent)' }} />
                <motion.div animate={{ scale: physics.pulse }} transition={{ duration: physics.speed2 / 2, repeat: Infinity, ease: "easeInOut" }} className="absolute w-1.5 h-1.5 bg-white rounded-full z-10 will-change-transform" style={{ boxShadow: `0 0 5px 2px #fff, ${physics.coreGlow} var(--accent)` }} />
                <span className="relative z-20 text-[22px] font-black mix-blend-screen" style={{ color: '#ffffff', textShadow: `0 0 10px var(--accent), 0 0 20px var(--accent)` }}>{mood.emoji}</span>
            </div>
        </div>
    );
};

// --- THE SUPERNOVA HUG LAUNCH SWITCH ---
const SupernovaLaunchSwitch = ({ onLaunch, isLaunching }: { onLaunch: () => void, isLaunching: boolean }) => {
    const [isCoverOpen, setIsCoverOpen] = useState(false);
    return (
        <div className="mt-auto w-full relative h-[70px] perspective-[800px] flex items-end justify-center">
            <div className="absolute bottom-0 w-full h-[50px] bg-[#0a0a0a] rounded-md border border-[#222] shadow-[inset_0_5px_15px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                <button 
                    onClick={() => { if(isCoverOpen && !isLaunching) { onLaunch(); setTimeout(() => setIsCoverOpen(false), 3000); } }}
                    className={`relative w-[85%] h-[34px] rounded-[3px] transition-all duration-75 flex items-center justify-center ${isCoverOpen ? 'bg-gradient-to-b from-[var(--accent)] to-[#991b1b] shadow-[0_0_20px_var(--accent),inset_0_2px_5px_rgba(255,255,255,0.4),0_4px_0_#450a0a] cursor-pointer' : 'bg-[#1a0505] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8),0_2px_0_#000] cursor-default'}`}
                >
                    <span className={`font-mono text-[10px] font-black tracking-[0.3em] transition-colors duration-300 ${isCoverOpen ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]' : 'text-[#450a0a]'}`}>
                        {isLaunching ? "TRANSMITTING" : "EXECUTE"}
                    </span>
                </button>
            </div>
            <motion.div 
                initial={false} animate={{ rotateX: isCoverOpen ? 110 : 0 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}
                onClick={() => !isLaunching && setIsCoverOpen(!isCoverOpen)}
                style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
                className={`absolute top-[18px] w-[96%] h-[52px] z-20 cursor-pointer rounded-sm border-[1.5px] border-red-500/40 bg-red-600/20 backdrop-blur-md flex items-center justify-center group will-change-transform ${isCoverOpen ? 'shadow-[0_-5px_20px_rgba(239,68,68,0.2)]' : 'shadow-[0_5px_15px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.2)] hover:bg-red-500/30'}`}
            >
                <div className="absolute -top-[2px] w-12 h-1.5 bg-black rounded-sm shadow-[0_1px_0_rgba(255,255,255,0.2)]" />
                <span className={`font-mono text-[8px] tracking-[0.4em] font-bold transition-opacity duration-200 mt-2 ${isCoverOpen ? 'opacity-0' : 'text-white/60 group-hover:text-white'}`}>LIFT TO ARM</span>
            </motion.div>
        </div>
    );
};

// --- CRT BOOT SEQUENCE COMPONENT ---
const BOOT_SEQUENCE = [
    { text: "BIOS VER 9.2.4 - CELESTIAL OS", delay: 400 },
    { text: "INITIALIZING POWER ROUTING...", delay: 800 },
    { text: "[OK] MAIN THRUSTERS ONLINE", delay: 1200 },
    { text: "PINGING STELLAR RELAY...", delay: 1800 },
    { text: "[OK] CONNECTION ESTABLISHED", delay: 2100 },
    { text: "MOUNTING CONSTELLATION_VAULT.SYS", delay: 2600 },
    { text: "CHECKING BIOMETRICS...", delay: 3200 },
    { text: "> MOOD SENSORS: CALIBRATED", delay: 3600 },
    { text: "> AFFECTION_CAPACITY: 99.9% (OVERFLOW WARNING)", delay: 4100 },
    { text: "DECRYPTING MEMORY NODES...", delay: 4800 },
    { text: "WELCOME BACK, COMMANDER.", delay: 5600 }
];

const CrtBootScreen = ({ onBootComplete }: { onBootComplete: () => void }) => {
    const [visibleLines, setVisibleLines] = useState<number>(0);
    const [isScreenOn, setIsScreenOn] = useState(false);

    useEffect(() => {
        const screenTimer = setTimeout(() => setIsScreenOn(true), 200);
        const timers = BOOT_SEQUENCE.map((line, index) => 
            setTimeout(() => {
                setVisibleLines(index + 1);
            }, line.delay + 600) 
        );
        const finishTimer = setTimeout(() => {
            onBootComplete();
        }, BOOT_SEQUENCE[BOOT_SEQUENCE.length - 1].delay + 2000);

        return () => {
            clearTimeout(screenTimer);
            clearTimeout(finishTimer);
            timers.forEach(clearTimeout);
        };
    }, [onBootComplete]);

    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
            <motion.div
                initial={{ clipPath: "inset(50% 50% 50% 50%)", filter: "brightness(2) contrast(1.5)" }}
                animate={isScreenOn ? { 
                    clipPath: [
                        "inset(50% 50% 50% 50%)",     
                        "inset(49.8% 0% 49.8% 0%)",   
                        "inset(0% 0% 0% 0%)"          
                    ],
                    filter: ["brightness(3) contrast(2)", "brightness(2) contrast(1.5)", "brightness(1) contrast(1)"]
                } : {}}
                transition={{ duration: 0.5, times: [0, 0.4, 1], ease: "easeOut" }}
                className="w-full h-full bg-[#030205] relative flex flex-col p-8 md:p-12"
            >
                <div className="absolute inset-0 pointer-events-none z-20 opacity-30" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)' }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#000_120%)] z-10 pointer-events-none" />

                <div className="relative z-30 flex flex-col gap-2 max-w-3xl">
                    {BOOT_SEQUENCE.slice(0, visibleLines).map((line, i) => (
                        <motion.div 
                            key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                            className="font-mono text-xs md:text-sm tracking-widest uppercase"
                            style={{ 
                                color: i === BOOT_SEQUENCE.length - 1 ? "var(--accent)" : "#F5F5F0",
                                textShadow: i === BOOT_SEQUENCE.length - 1 ? "0 0 10px var(--accent)" : "none",
                                opacity: i === BOOT_SEQUENCE.length - 1 ? 1 : 0.7
                            }}
                        >
                            {line.text}
                        </motion.div>
                    ))}
                    {visibleLines < BOOT_SEQUENCE.length && isScreenOn && (
<motion.div animate={{ opacity: [1, 1, 0, 0] }} transition={{ repeat: Infinity, duration: 0.8, times: [0, 0.5, 0.5, 1], ease: "linear" }} className="w-3 h-4 bg-[var(--accent)] mt-2" />                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default function DashboardPageV2() {
    const [isBooting, setIsBooting] = useState(true);
    const [currentMood, setCurrentMood] = useState(moods[0]);
    const [moodFlash, setMoodFlash] = useState(0); 
    const [pinging, setPinging] = useState(false);
    const [incomingPing, setIncomingPing] = useState(false);

    const [quote, setQuote] = useState({ text: "AWAITING DIRECTIVE...", author: "SYSTEM" });
    const [days, setDays] = useState(0);
    const [cipherText, setCipherText] = useState("");
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [allMemories, setAllMemories] = useState<any[]>([]);
    const [selectedMemory, setSelectedMemory] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabId | null>('uptime');

    useEffect(() => { document.documentElement.style.setProperty('--accent', currentMood.color); }, [currentMood]);

    useEffect(() => {
        async function fetchSystemState() {
            const { data: q } = await supabase.from('daily_quotes').select('*').order('created_at', { ascending: false }).limit(1);
            if (q?.[0]) setQuote({ text: q[0].quote_text, author: q[0].author });
            const { data: mData } = await supabase.from('mood_logs').select('mood_id').order('created_at', { ascending: false }).limit(1);
            if (mData?.[0]) { const matchedMood = moods.find(m => m.label === mData[0].mood_id); if (matchedMood) setCurrentMood(matchedMood); }
            const { data: memData } = await supabase.from('memories').select('*').order('memory_date', { ascending: false }).limit(50);
            if (memData?.[0]) { setAllMemories(memData); setSelectedMemory(memData[0]); }
            const { data: cData } = await supabase.from('secure_messages').select('message').order('created_at', { ascending: false }).limit(1);
            if (cData?.[0]) setCipherText(cData[0].message);
        }
        fetchSystemState();
        setDays(Math.floor((new Date().getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)));

        const pingChannel = supabase.channel('ping-listener').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interactions' }, (payload) => {
            if (payload.new.interaction_type === 'BOYFRIEND_PING') {
                setIncomingPing(true); setTimeout(() => setIncomingPing(false), 2500);
            }
        }).subscribe();
        return () => { supabase.removeChannel(pingChannel); };
    }, []);

    const handleMoodChange = async (m: typeof moods[0]) => {
        setCurrentMood(m);
        setMoodFlash(prev => prev + 1); 
        await supabase.from('mood_logs').insert([{ mood_id: m.label }]);
    };

    const sendHug = async () => {
        setPinging(true);
        await supabase.from('interactions').insert([{ interaction_type: 'GIRLFRIEND_PING', sender: 'MAHI_PORTAL' }]);
        setTimeout(() => setPinging(false), 3000);
    };

    const renderExpandedContent = (tabId: TabId) => {
        switch (tabId) {
            case 'uptime':
                return (
                    <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
                        <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, type: "spring" }} className="text-8xl md:text-[14rem] font-black tracking-tighter font-sans drop-shadow-[0_0_80px_rgba(232,222,181,0.2)] text-[#E8DEB5] relative z-10 will-change-transform">
                            {days}<span className="text-4xl text-[#F5F5F0]/20 ml-4 tracking-normal">d</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="font-sans font-bold text-lg tracking-[0.8em] uppercase text-[#F5F5F0]/50 mt-4 relative z-10 drop-shadow-md">Core_Uptime</motion.div>
                    </div>
                );
            case 'directive':
                return (
                    <div className="h-full flex flex-col justify-center p-12 md:p-24 relative overflow-hidden">
                        <div className="absolute top-[-5%] left-[5%] text-[30rem] opacity-[0.02] font-black text-[#F5F5F0] pointer-events-none leading-none">"</div>
                        <motion.h2 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-[#F5F5F0] leading-tight relative z-10 drop-shadow-2xl max-w-5xl">
                            "{quote.text}"
                        </motion.h2>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 font-sans font-bold text-xs text-[#E8DEB5] flex items-center gap-6 uppercase tracking-[0.4em] z-10">
                            <span className="w-24 h-[1px] bg-[#E8DEB5]/50"></span>
                            AUTHORIZATION: {quote.author}
                        </motion.div>
                    </div>
                );
            case 'comm':
                return (
                    <div className="h-full flex flex-col justify-center items-center relative p-10 overflow-hidden">
                        <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ repeat: Infinity, duration: 6, ease: "linear" }} className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E8DEB5]/30 to-transparent z-0 pointer-events-none will-change-transform" />
                        <div className={`absolute inset-0 p-12 flex items-center justify-center text-4xl md:text-5xl break-all overflow-hidden text-center transition-all duration-700 text-[#F5F5F0]/10 font-mono ${isDecrypting ? 'opacity-0 scale-95 blur-md' : 'opacity-100 scale-100 blur-none'}`}>
                            {cipherText ? cipherText.toLowerCase().split('').map((char) => charMap[char] || char).join('') : "AWAITING_DATA"}
                        </div>
                        <div className={`absolute inset-0 p-12 flex items-center justify-center bg-[#07040D]/70 text-[#F5F5F0] font-sans font-black text-2xl md:text-5xl leading-tight text-center transition-all duration-500 backdrop-blur-md ${isDecrypting ? 'opacity-100 z-20 scale-100 blur-none' : 'opacity-0 pointer-events-none scale-105 blur-md'}`}>
                            <ScrambleText text={`"${cipherText}"`} isDecrypting={isDecrypting} />
                        </div>
                        {cipherText && (
                            <button onMouseEnter={() => setIsDecrypting(true)} onMouseLeave={() => setIsDecrypting(false)} onTouchStart={() => setIsDecrypting(true)} onTouchEnd={() => setIsDecrypting(false)} className="absolute bottom-16 z-30 px-12 py-5 rounded-full bg-black/40 backdrop-blur-2xl border border-white/20 text-[#E8DEB5] font-sans font-bold text-xs uppercase tracking-[0.4em] transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(232,222,181,0.3)] hover:scale-105 active:scale-95">
                                Hold to Decrypt
                            </button>
                        )}
                    </div>
                );
            case 'vault':
                return (
                    <ConstellationVault memories={allMemories} selectedMemory={selectedMemory} setSelectedMemory={setSelectedMemory} />
                );
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col font-sans bg-[#07040D] text-[#F5F5F0] relative selection:bg-[#E8DEB5] selection:text-[#0A0612]">
            
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=League+Gothic&display=swap');
                @font-face { font-family: 'Victorian Parlor'; src: url('/fonts/VictorianParlor.ttf') format('truetype'); font-weight: normal; font-style: normal; }
                .font-victorian { font-family: 'Victorian Parlor', serif; }
                .font-gothic { font-family: 'League Gothic', sans-serif; }
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #E8DEB5; }
            `}</style>

            <motion.div key={`bg-sweep-${moodFlash}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: moodFlash > 0 ? [0, 0.45, 0] : 0, scale: moodFlash > 0 ? [0.8, 1.2, 1.4] : 1 }} transition={{ duration: 15, ease: "easeOut" }} className="absolute inset-0 z-0 pointer-events-none mix-blend-screen will-change-transform" style={{ background: `radial-gradient(circle at center, var(--accent) 0%, transparent 80%)` }} />

            <AnimatePresence>
                {pinging && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.4, 0] }} exit={{ opacity: 0 }} transition={{ duration: 1, times: [0, 0.1, 0.3, 1] }} className="absolute inset-0 z-[100] bg-white pointer-events-none mix-blend-overlay" />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {pinging && (
                    <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 m-auto w-[400px] h-[400px] rounded-full border-[2px] z-50 pointer-events-none will-change-transform" style={{ borderColor: 'var(--accent)', boxShadow: '0 0 100px var(--accent)' }} />
                )}
            </AnimatePresence>

            <div className="absolute inset-[-10%] w-[120%] h-[120%] pointer-events-none z-0">
                <div className="absolute inset-0 bg-[#07040D]" />
                <OrganicStars isWarp={pinging} />
                <CelestialEvents />
            </div>

            <div className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_0%,#030108_120%)] opacity-80" />

            <TopControls />
            <CommandRack activeTab={activeTab} setActiveTab={setActiveTab} />

            <AnimatePresence>
                {isBooting && (
                    <CrtBootScreen onBootComplete={() => setIsBooting(false)} />
                )}
            </AnimatePresence>

            <motion.div 
                className="flex flex-col h-full w-full z-10 relative max-w-[1700px] mx-auto p-4 md:p-8 px-8 md:px-20 gap-8" 
                initial={{ opacity: 0 }} animate={!isBooting ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 1.5 }}
            >
                <header className="w-full flex justify-between items-center shrink-0 pl-2">
                    <div className="flex items-center gap-6">
                        <CoreNebula mood={currentMood} />
                        <div className="relative perspective-[1000px] w-[320px] h-[70px] flex items-center">
                            <h1 className="flex items-center gap-2 drop-shadow-lg">
                                <span className="font-gothic text-[56px] tracking-tighter uppercase leading-none text-[#F5F5F0] mt-1.5">MAHI</span>
                                <motion.span className="font-victorian text-[64px] tracking-tight leading-none transition-colors duration-500" animate={{ textShadow: ['0 0 10px var(--accent)', '0 0 40px var(--accent)', '0 0 10px var(--accent)'] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} style={{ color: 'var(--accent)' }}>Portal</motion.span>
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden gap-8">
                    
                    <div className="flex-1 flex flex-col h-full relative z-10">
                        <AnimatePresence>
                            {activeTab && (
                                <AtmosphericCard moodFlash={moodFlash} bgClass="bg-black/30 backdrop-blur-xl border-white/[0.08]" key={`expanded-${activeTab}`} layoutId={`card-${activeTab}`} isExpanded={true} className="absolute inset-0 w-full h-full">
                                    <div className="w-full border-b border-white/[0.08] px-10 py-6 flex justify-between items-center pointer-events-none z-20 relative bg-gradient-to-b from-white/5 to-transparent">
                                        <span className="font-sans font-black tracking-[0.5em] text-[10px] uppercase text-[#E8DEB5]/80 drop-shadow-md flex items-center gap-4">
                                            <span className="w-2 h-2 rounded-full bg-[#E8DEB5]/60 shadow-[0_0_8px_#E8DEB5]" />
                                            {TABS.find(t => t.id === activeTab)?.title}
                                        </span>
                                        <span className="font-mono text-[8px] text-[#F5F5F0]/30 tracking-widest">SEC_0{TABS.findIndex(t => t.id === activeTab) + 1}</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden relative z-10">
                                        {renderExpandedContent(activeTab)}
                                    </div>
                                </AtmosphericCard>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-full md:w-[300px] flex flex-col h-full gap-5 shrink-0 z-20 overflow-y-auto custom-scroll pr-1">
                        
                        <AtmosphericCard moodFlash={moodFlash} className="flex-1 min-h-[250px]">
                            <div className="w-full border-b border-white/[0.08] px-6 py-4 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                                <span className="font-sans font-bold tracking-[0.3em] text-[8px] uppercase text-[#F5F5F0]/50">Atmosphere_Ctrl</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scroll p-4 flex flex-col gap-3">
                                {moods.map((m, i) => (
                                    <motion.button 
                                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                                        key={m.label} onClick={() => handleMoodChange(m)}
                                        className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all duration-300 ${currentMood.label === m.label ? 'bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md' : 'border-transparent bg-transparent hover:bg-white/5'}`}
                                        style={{ borderColor: currentMood.label === m.label ? 'var(--accent)' : 'transparent' }}
                                    >
                                        <span className={`font-sans font-black text-[9px] uppercase tracking-[0.2em] ${currentMood.label === m.label ? 'text-[var(--accent)] drop-shadow-[0_0_8px_var(--accent)]' : 'text-[#F5F5F0]/70'}`}>{m.label}</span>
                                        <span className="text-sm">{m.emoji}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </AtmosphericCard>

                        <AtmosphericCard moodFlash={moodFlash} className="h-[180px] shrink-0">
                            <div className="w-full border-b border-white/[0.08] px-6 py-4 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
                                <span className="font-sans font-bold tracking-[0.3em] text-[8px] uppercase text-[#F5F5F0]/50">System_Vitals</span>
                            </div>
                            <div className="flex flex-col p-6 gap-4 h-full relative">
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="font-sans font-bold text-[9px] text-[#F5F5F0]/60 uppercase tracking-[0.2em]">Affection_Cap</span>
                                    <span className="font-sans font-black text-[10px] text-[var(--accent)] transition-colors duration-500 drop-shadow-[0_0_8px_var(--accent)]">99.9%</span>
                                </div>
                                <SupernovaLaunchSwitch onLaunch={sendHug} isLaunching={pinging} />
                            </div>
                        </AtmosphericCard>
                    </div>

                </div>

                <AnimatePresence>
                    {incomingPing && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center bg-[var(--accent)]/10 backdrop-blur-lg">
                            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="text-9xl filter drop-shadow-[0_0_80px_var(--accent)]">❤️‍🔥</motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </div>
    );
}