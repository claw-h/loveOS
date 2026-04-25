"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { signOut } from 'next-auth/react';
import CupidBot from "@/components/CupidBot";

// Initialize Supabase Mainframe
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const START_DATE = new Date("2023-01-01"); 

const charMap: Record<string, string> = { 'a':'❤️','b':'💖','c':'💗','d':'💓','e':'💞','f':'💕','g':'💌','h':'💘','i':'💝','j':'💟','k':'❤️‍🔥','l':'🏩','m':'💒','n':'👰','o':'💍','p':'💎','q':'🌹','r':'🌷','s':'🌻','t':'🌼','u':'🎈','v':'🎁','w':'🎀','x':'🧸','y':'✨','z':'🌟',' ':'  ' };

const moods = [
    { label: "OPTIMAL", color: "#10b981", emoji: "💖", message: "All systems nominal." },
    { label: "ANXIOUS", color: "#f59e0b", emoji: "🌊", message: "Running background defrag. Be gentle." },
    { label: "LOW POWER", color: "#6366f1", emoji: "🌙", message: "Battery depleted. Commencing rest cycle." },
    { label: "CRITICAL", color: "#ef4444", emoji: "⚡", message: "Core overheat. Immediate hugs required." },
    { label: "MISSING_ADMIN", color: "#ec4899", emoji: "🧸", message: "Searching for Boyfriend... connection lost." }
    
];

const cuteNewsLines = [
    "BREAKING: Local boy literally cannot stop thinking about you.",
    "WEATHER: 100% chance of you looking absolutely gorgeous today.",
    "SYSTEM ALERT: You are the CSS to my HTML.",
    "UPDATE: Daily affection limits have been removed.",
    "NEWS: Scientists confirm you are the cutest person alive.",
    "LOG: Running background process 'loving_you.exe'...",
    "SECURITY: No bugs found in our relationship.",
    "BREAKING: Local girl's smile cited as primary source of renewable energy.",
    "WEATHER: Scattered heart-showers expected in your immediate vicinity.",
    "SYSTEM ALERT: Heart-rate spikes detected. Diagnosis: It's definitely love.",
    "UPDATE: Relationship firmware version 'FOREVER' successfully installed.",
    "NEWS: Expert panel finds that 10/10 doctors recommend your hugs.",
    "LOG: Memory leak detected in 'first_date.mov'—playing on loop.",
    "SECURITY: Intruder alert! Just kidding, it’s just me stealing a kiss.",
    "BREADCRUMBS: I left a trail of sparkles so you could find your way home.",
    "COMMERICAL: This relationship is brought to you by late night snacks and you.",
    "URGENT: Core temperature rising due to your extreme cuteness.",
    "STATUS: Disk space 99% full of photos of your face.",
    "PATCH NOTES: Fixed a bug where I wasn't cuddling you enough.",
    "TRAFFIC: Heavy congestion on the 'Thinking About You' expressway.",
    "RADAR: CupidBot has locked on to your coordinates. Resistance is adorable.",
    "REMINDER: You are the 'Main Branch' of my entire universe."
];

const getOrbEmoji = (id: string) => {
    const orbs = ['🔮', '🫧', '🧿', '🪩', '☄️', '✨'];
    const charCode = id.charCodeAt(id.length - 1) || 0;
    return orbs[charCode % orbs.length];
};

// --- ANIMATION VARIANTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 120, damping: 14 } }
};

// --- COMPONENTS ---
function AliveCard({ children, className = "", variants, onClick }: { children: React.ReactNode, className?: string, variants?: any, onClick?: () => void }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <motion.div
            variants={variants}
            ref={divRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative rounded-xl overflow-hidden p-[1px] bg-black shadow-2xl ${className}`}
        >
            <div className="absolute top-1/2 left-1/2 aspect-square w-[200%] animate-spin-slow opacity-40 z-0 pointer-events-none" style={{ background: 'conic-gradient(from 0deg, transparent 0%, var(--accent) 25%, transparent 50%, var(--accent) 75%, transparent 100%)' }} />
            <div className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0" style={{ opacity, background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, var(--accent), transparent 40%)` }} />
            <div className="relative h-full w-full bg-[#080808]/90 backdrop-blur-xl rounded-[10px] flex flex-col z-10 border border-white/5 overflow-hidden">
                <div className="absolute inset-0 -inset-y-20 z-20 pointer-events-none w-[50%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
                <div className="relative z-30 flex flex-col h-full w-full">{children}</div>
            </div>
        </motion.div>
    );
}

function TerminalHeader({ title, subtitle, accent = false }: { title: string, subtitle?: string, accent?: boolean }) {
    return (
        <div className="bg-black/50 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 border-b border-white/5 flex justify-between items-center z-30 pointer-events-none">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/20"></span>{title}</span>
            {subtitle && <span className={accent ? "text-[var(--accent)] transition-colors duration-500" : ""}>{subtitle}</span>}
        </div>
    );
}

function StatRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2 last:border-0 last:mb-0 pointer-events-none">
            <span className="font-mono text-[10px] opacity-50 uppercase tracking-widest">{label}</span>
            <span className="font-mono text-[10px] font-bold text-[var(--accent)] transition-colors duration-500">{value}</span>
        </div>
    );
}

// --- MAIN OS INTERFACE ---

export default function DashboardPage() {
    // GATEKEEPER STATE 🚀
    const [hasFedBot, setHasFedBot] = useState(false);

    const [isBooting, setIsBooting] = useState(true);
    const [bootText, setBootText] = useState("");
    const [globalFlicker, setGlobalFlicker] = useState(false);
    const [currentMood, setCurrentMood] = useState(moods[0]);
    const [quote, setQuote] = useState({ text: "INITIALIZING MAINFRAME...", author: "SYSTEM" });
    const [pinging, setPinging] = useState(false);
    const [days, setDays] = useState(0);
    const [cipherText, setCipherText] = useState("");
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [incomingPing, setIncomingPing] = useState(false);
    
    const [latestMemory, setLatestMemory] = useState<any>(null);
    const [allMemories, setAllMemories] = useState<any[]>([]);
    const [isMemoryVaultOpen, setIsMemoryVaultOpen] = useState(false);
    const [selectedMemory, setSelectedMemory] = useState<any>(null);
    
    const [currentTime, setCurrentTime] = useState("");
    const [currentDate, setCurrentDate] = useState("");
    const [newsIndex, setNewsIndex] = useState(0);

    // Boot Sequence
    useEffect(() => {
        const sequence = ["BIOS Check... OK", "Mounting /dev/sda1... OK", "Loading LOVE_OS Kernel...", "Establishing Secure Connection...", "Decrypting Vitals...", "Welcome to MAHI_PORTAL v3.0"];
        let i = 0;
        const interval = setInterval(() => {
            setBootText(prev => prev + sequence[i] + "\n");
            i++;
            if (i >= sequence.length) { clearInterval(interval); setTimeout(() => setIsBooting(false), 1200); }
        }, 400); 
        return () => clearInterval(interval);
    }, []);

    // Time & Date
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // News Ticker
    useEffect(() => {
        const newsTimer = setInterval(() => setNewsIndex((prev) => (prev + 1) % cuteNewsLines.length), 8000); 
        return () => clearInterval(newsTimer);
    }, []);

    // Accent Color Injector
    useEffect(() => { document.documentElement.style.setProperty('--accent', currentMood.color); }, [currentMood]);

    // Initial Database Fetch
    useEffect(() => {
        async function fetchSystemState() {
            const { data: quoteData } = await supabase.from('daily_quotes').select('*').order('created_at', { ascending: false }).limit(1);
            if (quoteData && quoteData.length > 0) setQuote({ text: quoteData[0].quote_text, author: quoteData[0].author });

            const { data: moodData } = await supabase.from('mood_logs').select('mood_id').order('created_at', { ascending: false }).limit(1);
            if (moodData && moodData.length > 0) {
                const matchedMood = moods.find(m => m.label === moodData[0].mood_id);
                if (matchedMood) setCurrentMood(matchedMood);
            }

            const { data: memData } = await supabase.from('memories').select('*').order('memory_date', { ascending: false }).limit(50);
            if (memData && memData.length > 0) {
                setAllMemories(memData);
                setLatestMemory(memData[0]);
                setSelectedMemory(memData[0]); 
            }
            const { data: cipherData } = await supabase.from('secure_messages').select('message').order('created_at', { ascending: false }).limit(1);
            if (cipherData && cipherData.length > 0) {
                setCipherText(cipherData[0].message);
            }
        }
        fetchSystemState();
        setDays(Math.floor((new Date().getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)));
    }, []);

    // Realtime Subscriptions
    useEffect(() => {
        const pingChannel = supabase.channel('ping-listener').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interactions' }, (payload) => {
            if (payload.new.interaction_type === 'BOYFRIEND_PING') {
                setGlobalFlicker(true); setIncomingPing(true);
                setTimeout(() => { setGlobalFlicker(false); setIncomingPing(false); }, 2000);
            }
        }).subscribe();
        return () => { supabase.removeChannel(pingChannel); };
    }, []);

    useEffect(() => {
        const cipherChannel = supabase.channel('cipher-listener').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secure_messages' }, (payload) => {
            setCipherText(payload.new.message);
            setGlobalFlicker(true);
            setTimeout(() => setGlobalFlicker(false), 800);
        }).subscribe();
        return () => { supabase.removeChannel(cipherChannel); };
    }, []);

    // 🚀 UNIFIED MOOD CONTROLLER
    const handleMoodChange = async (m: typeof moods[0]) => {
        setCurrentMood(m);
        await supabase.from('mood_logs').insert([{ mood_id: m.label }]);
    };

    const handleBotMoodChange = async (botMoodId: string) => {
        // Find the matching OS mood from the Bot's string token
        const matchedMood = moods.find(m => m.label === botMoodId) || moods[0];
        await handleMoodChange(matchedMood);
    };

    const handleBotUnlock = async (botMoodId: string) => {
        const matchedMood = moods.find(m => m.label === botMoodId) || moods[0];
        setCurrentMood(matchedMood);
        setHasFedBot(true);
        await supabase.from('mood_logs').insert([{ mood_id: matchedMood.label }]);
    };

    const sendHug = async () => {
        setPinging(true);
        await supabase.from('interactions').insert([{ interaction_type: 'GIRLFRIEND_PING', sender: 'MAHI_PORTAL' }]);
        setTimeout(() => setPinging(false), 3000);
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col font-sans bg-[#050505] text-[#ffffff] relative">
            
            <style jsx global>{`
                @keyframes spin-slow { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 10s linear infinite; }
                @keyframes shimmer { 0% { transform: translateX(-150%) skewX(-15deg); } 50%, 100% { transform: translateX(300%) skewX(-15deg); } }
                .animate-shimmer { animation: shimmer 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes crt-flicker { 0%, 10%, 100% { opacity: 1; filter: brightness(1); } 5% { opacity: 0.80; filter: brightness(1.1); } }
                .animate-crt-flicker { animation: crt-flicker 0.15s infinite; }
                @keyframes global-glitch { 0%, 60%, 100% { opacity: 1; transform: translateX(0); } 20% { opacity: 0.85; transform: translateX(-2px); } 40% { opacity: 0.9; transform: translateX(1px); } }
                .animate-global-glitch { animation: global-glitch 0.2s linear infinite; }

                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--accent); }

                .scanlines { background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 4px, 6px 100%; }
            `}</style>

            <AnimatePresence>
                {isBooting && (
                    <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} transition={{ duration: 0.8 }} className="absolute inset-0 z-[100] bg-[#020202] flex flex-col justify-center items-start p-8 md:p-16 overflow-hidden">
                        <div className="absolute inset-0 z-0 pointer-events-none scanlines opacity-60"></div>
                        <div className="relative z-10 font-mono text-xl md:text-3xl text-[var(--accent)] whitespace-pre-line leading-relaxed tracking-widest animate-crt-flicker" style={{ textShadow: '0 0 5px var(--accent), 0 0 15px var(--accent)' }}>
                            {bootText}
                            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4 }}>_</motion.span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div animate={{ backgroundColor: currentMood.color, x: [0, 50, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.1, 0.9, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[120px] opacity-20" />
                <motion.div animate={{ backgroundColor: currentMood.color, x: [0, -30, 40, 0], y: [0, 50, -20, 0], scale: [1, 0.9, 1.2, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full filter blur-[140px] opacity-15" />
            </div>

            {/* 🚀 PERSISTENT CUPID-BOT LAYER */}
            {!isBooting && (
                <div className={`absolute inset-0 z-[60] transition-colors duration-1000 pointer-events-none ${!hasFedBot ? 'bg-[#050505]/80 backdrop-blur-xl' : 'bg-transparent pointer-events-none'}`}>
                    <CupidBot 
                        isCompact={hasFedBot} 
                        activeMoodId={currentMood.label}
                        onUnlock={handleBotUnlock}
                        onMoodChange={handleBotMoodChange}
                    />
                </div>
            )}

            {/* MAIN DASHBOARD UI (Only animates in AFTER bot is fed) */}
            <motion.div 
                className={`flex flex-col h-full w-full z-10 relative ${!hasFedBot ? 'hidden' : ''}`} 
                variants={containerVariants} 
                initial="hidden" 
                animate={(!isBooting && hasFedBot) ? "show" : "hidden"}
            >
                <div className={`flex flex-col h-full w-full ${globalFlicker ? 'animate-global-glitch' : ''}`}>
                    
                    {/* Header */}
                    <motion.header variants={itemVariants} className="w-full bg-black/40 backdrop-blur-xl border-b border-white/10 p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative shrink-0">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-500 shrink-0" style={{ borderColor: 'var(--accent)', backgroundColor: 'rgba(255,255,255,0.03)', boxShadow: '0 0 20px -5px var(--accent)' }}>
                                <span className="text-2xl">{currentMood.emoji}</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold tracking-tighter flex items-center gap-2">
                                    LOVE_OS <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border transition-colors duration-500" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'rgba(255,255,255,0.05)' }}>v3.0</span>
                                </h1>
                                <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest mt-1">Status: {currentMood.message}</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full max-w-xl mx-auto bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-3 overflow-hidden">
                            <span className="animate-pulse shrink-0">✨</span>
                            <div className="font-mono text-[10px] md:text-xs uppercase tracking-widest truncate">
                                <span className="font-bold transition-colors duration-500" style={{ color: 'var(--accent)' }}>LATEST: </span>
                                <AnimatePresence mode="wait">
                                    <motion.span key={newsIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-white/70 inline-block">{cuteNewsLines[newsIndex]}</motion.span>
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right font-mono hidden sm:block">
                                <div className="text-2xl font-bold tracking-tighter transition-colors duration-500" style={{ color: 'var(--accent)', textShadow: '0 0 10px var(--accent)' }}>{currentTime || "00:00:00"}</div>
                                <div className="text-[10px] opacity-50 uppercase tracking-widest">{currentDate || "LOADING_DATE..."}</div>
                            </div>
                            <button onClick={() => signOut({ callbackUrl: '/login' })} className="group flex items-center justify-center p-3 rounded-xl border border-white/10 hover:border-red-500/50 bg-white/5 hover:bg-red-500/10 transition-all duration-300 pointer-events-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 group-hover:text-red-400 transition-colors"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                            </button>
                        </div>
                    </motion.header>

                    {/* MAIN CONTENT GRID */}
                    <div className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-4 overflow-hidden animate-float">
                        
                        {/* LEFT COLUMN */}
                        <div className="flex flex-col gap-4 w-full md:w-80 h-full">
                            <AliveCard variants={itemVariants} className="h-48 shrink-0">
                                <TerminalHeader title="Core_Uptime" subtitle="ACTIVE" accent />
                                <div className="p-6 flex-1 flex flex-col justify-center items-center">
                                    <div className="text-5xl font-bold tracking-tighter font-mono drop-shadow-lg transition-colors duration-500" style={{ color: 'var(--accent)' }}>
                                        {days}<span className="text-xl text-white/30">d</span>
                                    </div>
                                </div>
                            </AliveCard>

                            <AliveCard variants={itemVariants} className="flex-1 min-h-0 pointer-events-auto">
                                <TerminalHeader title="System_Vitals" />
                                <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto custom-scroll">
                                    <div>
                                        <StatRow label="Affection_Capacity" value="99.9%" />
                                        <StatRow label="Patience_Buffer" value="MAXIMUM" />
                                        <StatRow label="Memory_Storage" value="INFINITE_GB" />
                                    </div>
                                    <div className="mt-auto">
                                        <button onClick={sendHug} disabled={pinging} className="w-full py-3 rounded-lg text-black font-bold font-mono text-[9px] uppercase tracking-widest transition-all duration-500" style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 15px -5px var(--accent)', opacity: pinging ? 0.7 : 1 }}>
                                            {pinging ? "TRANSMITTING..." : "CMD: EXECUTE_VIRTUAL_HUG"}
                                        </button>
                                    </div>
                                </div>
                            </AliveCard>

                            <AliveCard variants={itemVariants} className="h-48 shrink-0 overflow-hidden group pointer-events-auto">
                                <TerminalHeader title="Secure_Comm_Protocol" subtitle="ENCRYPTED_PAYLOAD" accent />
                                <div className="flex flex-col h-full relative justify-center items-center">
                                    <div className={`absolute inset-0 p-6 flex items-center justify-center text-2xl md:text-3xl break-all overflow-y-auto custom-scroll text-center transition-opacity duration-700 ${isDecrypting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                        {cipherText ? cipherText.toLowerCase().split('').map((char) => charMap[char] || char).join('') : <span className="font-mono text-[9px] opacity-30 italic">AWAITING_TRANSMISSION...</span>}
                                    </div>
                                    <div className={`absolute inset-0 p-6 flex items-center justify-center bg-black/80 backdrop-blur-xl text-white/90 font-mono text-sm md:text-base leading-relaxed text-center transition-all duration-700 ${isDecrypting ? 'opacity-100 z-20 scale-100' : 'opacity-0 pointer-events-none scale-105'}`}>
                                        <span className="drop-shadow-[0_0_10px_var(--accent)] text-[var(--accent)] font-bold mr-2">{">"}</span>
                                        "{cipherText}"
                                    </div>
                                    {cipherText && (
                                        <button
                                            onMouseEnter={() => setIsDecrypting(true)}
                                            onMouseLeave={() => setIsDecrypting(false)}
                                            onTouchStart={() => setIsDecrypting(true)}
                                            onTouchEnd={() => setIsDecrypting(false)}
                                            className="absolute bottom-4 z-30 px-5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/50 font-mono text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"
                                        >
                                            [ HOLD_TO_DECRYPT ]
                                        </button>
                                    )}
                                </div>
                            </AliveCard>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col gap-4 flex-1 h-full min-w-0">
                            
                            <AliveCard variants={itemVariants} className="flex-1 min-h-0">
                                <TerminalHeader title="Directive.txt" subtitle="READ_ONLY" accent />
                                <div className="p-8 h-full flex flex-col justify-center bg-black/20">
                                    <h2 className="text-2xl md:text-4xl font-light leading-relaxed text-white/90">
                                        "{quote.text}"
                                    </h2>
                                    <div className="mt-8 font-mono text-xs opacity-40 flex items-center gap-2">
                                        <span className="w-6 h-px bg-white/40"></span>
                                        AUTHORIZED_BY: {quote.author}
                                    </div>
                                </div>
                            </AliveCard>

                            <AliveCard variants={itemVariants} className="flex-1 min-h-0 overflow-hidden group cursor-pointer border hover:border-[var(--accent)] transition-all duration-500 pointer-events-auto" onClick={() => setIsMemoryVaultOpen(true)}>
                                <TerminalHeader title="Memory_Vault.exe" subtitle={`${allMemories.length}_ENTRIES`} accent />
                                <div className="relative h-full w-full bg-black/50 p-6 flex flex-col justify-center items-center overflow-hidden">
                                    {allMemories.length > 0 ? (
                                        <>
                                            <div className="flex flex-wrap gap-4 justify-center items-center z-10">
                                                {allMemories.map((mem, i) => (
                                                    <motion.div key={mem.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.05, type: "spring" }} className="text-3xl md:text-4xl filter drop-shadow-[0_0_15px_var(--accent)] group-hover:scale-110 transition-transform duration-300">
                                                        {getOrbEmoji(mem.id)}
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                                                <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-[var(--accent)] text-[var(--accent)] font-mono text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                                                    Initialize Vault
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="font-mono text-[10px] opacity-30 italic flex items-center gap-2 animate-pulse">
                                            <span>[NO_DATA_FOUND]</span>
                                            <span>AWAITING_UPLOAD...</span>
                                        </div>
                                    )}
                                </div>
                            </AliveCard>

                            <AliveCard variants={itemVariants} className="shrink-0 pointer-events-auto">
                                <TerminalHeader title="Mood_Controller.exe" />
                                <div className="p-3">
                                    <div className="flex gap-2 overflow-x-auto custom-scroll pb-1">
                                        {moods.map(m => (
                                            <button 
                                                key={m.label} onClick={() => handleMoodChange(m)}
                                                className={`flex-1 min-w-[80px] flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-300 z-30 ${currentMood.label === m.label ? 'bg-white/10 shadow-lg' : 'border-white/5 hover:border-white/20 bg-black/40'}`}
                                                style={{ borderColor: currentMood.label === m.label ? 'var(--accent)' : '' }}
                                            >
                                                <span className="text-xl mb-1">{m.emoji}</span>
                                                <span className="font-mono text-[8px] uppercase tracking-widest opacity-80">{m.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </AliveCard>
                        </div>
                    </div>
                </div>

                {/* MODALS */}
                <AnimatePresence>
                    {isMemoryVaultOpen && (
                        <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(20px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} transition={{ duration: 0.4, ease: "easeInOut" }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-black/40 pointer-events-auto">
                            <motion.div initial={{ scale: 0.9, y: 30, opacity: 0, filter: "blur(10px)" }} animate={{ scale: 1, y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ scale: 0.9, y: 30, opacity: 0, filter: "blur(10px)" }} transition={{ type: "spring", stiffness: 200, damping: 25 }} className="w-full max-w-6xl h-[90vh] md:h-[85vh] bg-black/70 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row relative shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                                <button onClick={() => setIsMemoryVaultOpen(false)} className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/50 backdrop-blur-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                                
                                {/* LEFTSIDE VAULT LIST */}
                                <div className="w-full md:w-1/3 border-r border-white/5 bg-black/30 flex flex-col h-1/3 md:h-full">
                                    <div className="p-4 md:p-6 border-b border-white/5 bg-black/20 shrink-0">
                                        <h2 className="text-xl font-bold tracking-tighter flex items-center gap-2 text-white/90">
                                            <span className="text-[var(--accent)]">/</span>memory_vault
                                        </h2>
                                        <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest mt-1">Archived Data Units: {allMemories.length}</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scroll p-2 md:p-4 flex flex-col gap-2">
                                        {allMemories.map((mem) => (
                                            <button 
                                                key={mem.id} onClick={() => setSelectedMemory(mem)}
                                                className={`text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 group ${selectedMemory?.id === mem.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                            >
                                                <div className="text-2xl filter drop-shadow-md group-hover:scale-110 transition-transform">{getOrbEmoji(mem.id)}</div>
                                                <div className="overflow-hidden">
                                                    <div className={`font-bold text-sm truncate ${selectedMemory?.id === mem.id ? 'text-[var(--accent)]' : 'text-white/80'}`}>{mem.title}</div>
                                                    <div className="font-mono text-[9px] opacity-50 uppercase mt-1">{new Date(mem.memory_date).toLocaleDateString()}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* RIGHTSIDE VAULT DISPLAY */}
                                <div className="flex-1 flex flex-col bg-gradient-to-br from-black/20 to-black/80 h-2/3 md:h-full overflow-y-auto custom-scroll relative">
                                    {selectedMemory && (
                                        <>
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full filter blur-[100px] pointer-events-none"></div>
                                            <motion.div key={selectedMemory.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-6 md:p-12 flex flex-col max-w-3xl mx-auto w-full relative z-10">
                                                <div className="font-mono text-[10px] text-[var(--accent)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                    <span className="w-8 h-px bg-[var(--accent)]/50"></span>
                                                    ENTRY_LOG: {new Date(selectedMemory.memory_date).toLocaleDateString()}
                                                </div>
                                                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8 leading-tight drop-shadow-md">{selectedMemory.title}</h1>
                                                {selectedMemory.image_url && (
                                                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group bg-black">
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
                                                        <img src={selectedMemory.image_url} alt={selectedMemory.title} className="w-full max-h-[500px] object-contain transform group-hover:scale-[1.02] transition-transform duration-700" />
                                                    </div>
                                                )}
                                                <div className="prose prose-invert prose-p:text-white/70 prose-p:leading-relaxed prose-p:text-lg max-w-none bg-white/5 p-6 md:p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
                                                    <p>{selectedMemory.description}</p>
                                                </div>
                                                <div className="mt-12 flex justify-center opacity-30">
                                                    <span className="w-8 h-px bg-[var(--accent)]/50"></span>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* INCOMING PING OVERLAY */}
                <AnimatePresence>
                    {incomingPing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                            className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center bg-[var(--accent)]/10 backdrop-blur-md"
                        >
                            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} className="text-9xl filter drop-shadow-[0_0_40px_var(--accent)]">
                                ❤️‍🔥
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}