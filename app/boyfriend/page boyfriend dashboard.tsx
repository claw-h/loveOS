"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { signOut } from 'next-auth/react';

// Initialize Supabase Mainframe
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// --- ANIMATION VARIANTS & COMPONENTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 120, damping: 14 } }
};

function AliveCard({ children, className = "", variants }: { children: React.ReactNode, className?: string, variants?: any }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <motion.div variants={variants} ref={divRef} onMouseMove={handleMouseMove} onMouseEnter={() => setOpacity(1)} onMouseLeave={() => setOpacity(0)} className={`relative rounded-xl overflow-hidden p-[1px] bg-black shadow-2xl ${className}`}>
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
        <div className="bg-black/50 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 border-b border-white/5 flex justify-between items-center z-30">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/20"></span>{title}</span>
            {subtitle && <span className={accent ? "text-[var(--accent)] transition-colors duration-500" : ""}>{subtitle}</span>}
        </div>
    );
}

// --- BOYFRIEND DASHBOARD MAIN ---
export default function BoyfriendDashboard() {
    const [isMounted, setIsMounted] = useState(false);
    const [currentTime, setCurrentTime] = useState("");
    const [partnerMood, setPartnerMood] = useState<string>("AWAITING_DATA...");
    const [lastSync, setLastSync] = useState<string>("Never");
    
    // Directive State
    const [newQuote, setNewQuote] = useState("");
    const [author, setAuthor] = useState("BOYFRIEND_TERMINAL");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState("");
    const [pinging, setPinging] = useState(false);

    // 🚀 NEW: Memory Vault State
    const [memoryFile, setMemoryFile] = useState<File | null>(null);
    const [memoryCaption, setMemoryCaption] = useState("");
    const [memoryDate, setMemoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUploadingMemory, setIsUploadingMemory] = useState(false);
    const [memoryStatus, setMemoryStatus] = useState("");

    const [girlfriendPing, setGirlfriendPing] = useState(false);

    const [secretMessage, setSecretMessage] = useState("");
    const [isSendingSecret, setIsSendingSecret] = useState(false);

    const SYS_COLOR = "#0ea5e9"; // Cyber Cyan

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--accent', SYS_COLOR);
    }, []);

    useEffect(() => {
        async function fetchPartnerStatus() {
            const { data, error } = await supabase.from('mood_logs').select('*').order('created_at', { ascending: false }).limit(1);
            if (!error && data && data.length > 0) {
                setPartnerMood(data[0].mood_id);
                setLastSync(new Date(data[0].created_at).toLocaleTimeString());
            } else {
                setPartnerMood("NO_DATA_FOUND");
            }
        }
        fetchPartnerStatus();
    }, []);

    useEffect(() => {
        const moodChannel = supabase
            .channel('telemetry-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mood_logs' }, (payload) => {
                setPartnerMood(payload.new.mood_id);
                setLastSync(new Date(payload.new.created_at).toLocaleTimeString());
            })
            .subscribe();
        return () => { supabase.removeChannel(moodChannel); };
    }, []);
    // 🚀 NEW: Listen for Mahi's Pings
    useEffect(() => {
        const pingChannel = supabase
            .channel('admin-ping-listener')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'interactions' },
                (payload) => {
                    if (payload.new.interaction_type === 'GIRLFRIEND_PING') {
                        console.log("🚨 ATTENTION REQUESTED BY PARTNER");
                        setGirlfriendPing(true);
                        
                        // Keep the alarm on for 3 seconds
                        setTimeout(() => setGirlfriendPing(false), 3000);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(pingChannel); };
    }, []);
    const handleOverride = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuote.trim()) return;
        setIsSubmitting(true);
        setSubmitStatus("UPLOADING TO MAINFRAME...");

        const { error } = await supabase.from('daily_quotes').insert([{ quote_text: newQuote, author: author }]);

        if (error) {
            setSubmitStatus("ERROR: TRANSMISSION FAILED.");
        } else {
            setSubmitStatus("OVERRIDE SUCCESSFUL.");
            setNewQuote("");
            setTimeout(() => setSubmitStatus(""), 4000);
        }
        setIsSubmitting(false);
    };

    // 🚀 NEW: Memory Upload Handler
    const handleMemoryUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memoryFile || !memoryCaption) return;

        setIsUploadingMemory(true);
        setMemoryStatus("UPLOADING TO STORAGE...");

        try {
            // 1. Upload File to Storage
            const fileExt = memoryFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('memories')
                .upload(fileName, memoryFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('memories')
                .getPublicUrl(fileName);

            setMemoryStatus("SYNCING DATABASE...");

            // 3. Insert Database Record
            const { error: dbError } = await supabase
                .from('memories')
                .insert([{ 
                    image_url: publicUrl, 
                    caption: memoryCaption, 
                    memory_date: memoryDate 
                }]);

            if (dbError) throw dbError;

            setMemoryStatus("MEMORY VAULT SYNCED.");
            setMemoryFile(null);
            setMemoryCaption("");
            
            // Reset the file input visually
            const fileInput = document.getElementById('memory-file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            setTimeout(() => setMemoryStatus(""), 4000);
        } catch (error) {
            console.error("Memory sync failed:", error);
            setMemoryStatus("ERROR: SYNC FAILED.");
        } finally {
            setIsUploadingMemory(false);
        }
    };
    const handleSendSecret = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!secretMessage.trim()) return;
        setIsSendingSecret(true);
        
        await supabase.from('secure_messages').insert([{ message: secretMessage }]);
        
        setSecretMessage("");
        setIsSendingSecret(false);
    };
    const sendPing = async () => {
        setPinging(true);
        await supabase.from('interactions').insert([{ interaction_type: 'BOYFRIEND_PING', sender: 'SYS_ADMIN' }]);
        setTimeout(() => setPinging(false), 3000);
    };

    if (!isMounted) return <div className="h-screen w-screen bg-[#050505]"></div>;

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col font-sans bg-[#050505] text-[#ffffff] relative">
            
            <style jsx global>{`
                @keyframes spin-slow { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 10s linear infinite; }
                @keyframes shimmer { 0% { transform: translateX(-150%) skewX(-15deg); } 50%, 100% { transform: translateX(300%) skewX(-15deg); } }
                .animate-shimmer { animation: shimmer 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
                
                /* Custom scrollbar for right column */
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--accent); }
            `}</style>

            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div animate={{ backgroundColor: SYS_COLOR, x: [0, 30, -10, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full filter blur-[130px] opacity-[0.15]" />
            </div>

            <motion.div className="flex flex-col h-full w-full z-10 relative" variants={containerVariants} initial="hidden" animate="show">
                
                {/* HEADER */}
                <motion.header variants={itemVariants} className="w-full bg-black/40 backdrop-blur-xl border-b border-white/10 p-5 flex justify-between items-center z-40 relative shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[var(--accent)] bg-white/[0.03]" style={{ boxShadow: '0 0 20px -5px var(--accent)' }}>
                            <span className="text-xl">👨‍💻</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tighter flex items-center gap-2">
                                SYS_ADMIN <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border border-[var(--accent)] text-[var(--accent)] bg-white/[0.05]">CONSOLE</span>
                            </h1>
                            <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest mt-1">Role: Boyfriend // Clearance: LEVEL_MAX</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right font-mono hidden sm:block">
                            <div className="text-2xl font-bold tracking-tighter text-[var(--accent)]" style={{ textShadow: '0 0 10px var(--accent)' }}>{currentTime || "00:00:00"}</div>
                            <div className="text-[10px] opacity-50 uppercase tracking-widest">LOCAL_TIME</div>
                        </div>
                        <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-3 rounded-xl border border-white/10 hover:border-red-500/50 bg-white/5 hover:bg-red-500/10 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 hover:text-red-400"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                        </button>
                    </div>
                </motion.header>

                {/* DESKTOP WORKSPACE */}
                <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden animate-float">
                    
                    {/* LEFT COLUMN: Status & Comm */}
                    <div className="flex flex-col gap-6 w-full md:w-96 h-full shrink-0">
                        <AliveCard variants={itemVariants} className="h-64 shrink-0">
                            <TerminalHeader title="Partner_Telemetry" subtitle="LIVE_TRACKING" accent />
                            <div className="p-6 flex flex-col justify-center h-full">
                                <span className="font-mono text-[10px] uppercase text-white/50 tracking-widest mb-2">Current_Mood_State:</span>
                                <div className="text-4xl font-bold tracking-tighter font-mono text-[var(--accent)] mb-4" style={{ textShadow: '0 0 15px var(--accent)' }}>
                                    {partnerMood}
                                </div>
                                <div className="mt-auto border-t border-white/10 pt-4 flex justify-between items-center">
                                    <span className="font-mono text-[9px] uppercase text-white/40">Last_Sync: {lastSync}</span>
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_10px_var(--accent)]"></span>
                                </div>
                            </div>
                        </AliveCard>

                        <AliveCard variants={itemVariants} className="flex-1 min-h-0">
                            <TerminalHeader title="Direct_Comm_Link" />
                            <div className="p-6 flex flex-col justify-center items-center h-full gap-4 text-center">
                                <div className="text-4xl mb-2">📡</div>
                                <p className="font-mono text-xs text-white/50 uppercase tracking-widest leading-relaxed">
                                    Initiate haptic ping to Partner's terminal.
                                </p>
                                <button 
                                    onClick={sendPing}
                                    disabled={pinging}
                                    className="w-full mt-auto py-4 rounded-xl text-black font-bold font-mono text-[10px] uppercase tracking-widest transition-all duration-500"
                                    style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 20px -5px var(--accent)', opacity: pinging ? 0.7 : 1 }}
                                >
                                    {pinging ? "TRANSMITTING SIGNAL..." : "PING MAHI_PORTAL"}
                                </button>
                            </div>
                        </AliveCard>
                    </div>

                    {/* RIGHT COLUMN: Overrides & Uploads (Now Scrollable) */}
                    <div className="flex flex-col gap-6 flex-1 h-full min-w-0 overflow-y-auto custom-scroll pr-2 pb-2">
                        
                        {/* QUOTE OVERRIDE CARD */}
                        <AliveCard variants={itemVariants} className="shrink-0">
                            <TerminalHeader title="Directive_Override.exe" subtitle="WRITE_ACCESS" accent />
                            <form onSubmit={handleOverride} className="p-6 flex flex-col gap-4">
                                <div className="flex justify-between items-end">
                                    <label className="font-mono text-[10px] uppercase text-white/50 tracking-widest pl-1">Input_New_Quote:</label>
                                    <span className="font-mono text-[9px] uppercase text-[var(--accent)] opacity-70">{submitStatus}</span>
                                </div>
                                <textarea 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none transition-all resize-none text-white/90 placeholder:text-white/20 custom-scroll h-24"
                                    placeholder="Type the next message for her dashboard..."
                                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    value={newQuote}
                                    onChange={(e) => setNewQuote(e.target.value)}
                                    required
                                />
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input 
                                        type="text"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-xs focus:outline-none transition-all text-[var(--accent)]"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                    />
                                    <button type="submit" disabled={isSubmitting || !newQuote.trim()} className="px-6 py-3 rounded-xl text-black font-bold font-mono text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 15px -5px var(--accent)' }}>
                                        {isSubmitting ? "UPLOADING..." : "EXECUTE"}
                                    </button>
                                </div>
                            </form>
                        </AliveCard>

                        {/* 🚀 NEW: MEMORY VAULT UPLOADER */}
                        <AliveCard variants={itemVariants} className="shrink-0">
                            <TerminalHeader title="Memory_Uploader.exe" subtitle="STORAGE_ACCESS" accent />
                            <form onSubmit={handleMemoryUpload} className="p-6 flex flex-col gap-5">
                                <div className="flex justify-between items-end">
                                    <label className="font-mono text-[10px] uppercase text-white/50 tracking-widest pl-1">Select_Image_File:</label>
                                    <span className="font-mono text-[9px] uppercase text-[var(--accent)] opacity-70">{memoryStatus}</span>
                                </div>
                                
                                <input 
                                    id="memory-file"
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setMemoryFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent)] file:text-black hover:file:bg-[var(--accent)]/80 transition-all font-mono"
                                    required
                                />

                                <div>
                                    <label className="font-mono text-[10px] uppercase text-white/50 tracking-widest pl-1 mb-2 block">Caption:</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-sm focus:outline-none transition-all text-white/90 placeholder:text-white/20"
                                        placeholder="Add a cute caption..."
                                        value={memoryCaption}
                                        onChange={(e) => setMemoryCaption(e.target.value)}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="font-mono text-[10px] uppercase text-white/50 tracking-widest pl-1 mb-2 block">Memory_Date:</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-sm focus:outline-none transition-all text-white/90"
                                            value={memoryDate}
                                            onChange={(e) => setMemoryDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isUploadingMemory || !memoryFile || !memoryCaption} 
                                        className="mt-auto px-6 py-3 rounded-xl text-black font-bold font-mono text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50 h-[46px]" 
                                        style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 15px -5px var(--accent)' }}
                                    >
                                        {isUploadingMemory ? "SYNCING..." : "UPLOAD_MEMORY"}
                                    </button>
                                </div>
                            </form>
                        </AliveCard>
                    {/* SECURE COMM TRANSMITTER */}
                        <AliveCard variants={itemVariants} className="shrink-0">
                            <TerminalHeader title="Secure_Comm_Transmitter.exe" subtitle="ENCRYPTED_PAYLOAD" accent />
                            <form onSubmit={handleSendSecret} className="p-6 flex flex-col gap-4">
                                <label className="font-mono text-[10px] uppercase text-white/50 tracking-widest pl-1">Transmit_Cipher_Message:</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none transition-all resize-none text-white/90 placeholder:text-white/20 custom-scroll h-24"
                                    placeholder="Type a secret message to encrypt..."
                                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    value={secretMessage}
                                    onChange={(e) => setSecretMessage(e.target.value)}
                                    required
                                />
                                <button type="submit" disabled={isSendingSecret || !secretMessage.trim()} className="w-full py-3 rounded-xl text-black font-bold font-mono text-[10px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50" style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 15px -5px var(--accent)' }}>
                                    {isSendingSecret ? "ENCRYPTING..." : "SEND SECURE TRANSMISSION"}
                                </button>
                            </form>
                        </AliveCard>
                    </div>
                </div>
            </motion.div>
            {/* 🚨 GIRLFRIEND PING ALARM OVERLAY */}
                <AnimatePresence>
                    {girlfriendPing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, filter: "blur(10px)" }}
                            className="absolute inset-0 z-[200] pointer-events-none flex items-center justify-center bg-pink-600/20 backdrop-blur-md border-[12px] border-pink-500/80"
                        >
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1] }} 
                                transition={{ repeat: Infinity, duration: 0.4 }}
                                className="text-center font-mono"
                            >
                                <div className="text-8xl mb-6">🚨💖🚨</div>
                                <h1 className="text-4xl md:text-6xl font-black text-pink-400 tracking-tighter" style={{ textShadow: '0 0 30px rgba(236,72,153,1)' }}>
                                    ATTENTION REQUIRED
                                </h1>
                                <p className="text-pink-200 mt-4 tracking-widest uppercase">Incoming transmission from Mahi_Portal</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
        </div>
    );
}