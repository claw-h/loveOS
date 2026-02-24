"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';

export default function TopControls() {
    const [time, setTime] = useState<Date | null>(null);
    const [isAdminOnline, setIsAdminOnline] = useState(false); 

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null; // Prevents Next.js hydration crashes

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    });
    
    const parts = formatter.formatToParts(time);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
    
    const istHour = parseInt(getPart('hour'), 10);
    const istMinute = parseInt(getPart('minute'), 10);

    const displayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const displayTime = displayFormatter.format(time);

    const isMeteorInbound = istHour === 23 && istMinute >= 40 && istMinute < 55;
    const isMeteorActive = istHour === 23 && istMinute >= 55;

    return (
        <div className="absolute top-6 right-8 z-50 flex items-start gap-5">
            
            {/* LEFT: System Blinkers */}
            <div className="flex flex-col gap-2 mt-2 font-mono text-[8px] tracking-[0.2em] text-right opacity-80">
                
                {/* Admin Status Blinker */}
                <div className="flex items-center gap-2 justify-end">
                    <span className={`transition-colors duration-500 ${isAdminOnline ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-white/30'}`}>
                        {isAdminOnline ? 'ADMIN IN MAINFRAME' : 'NOT CONNECTED'}
                    </span>
                    <div className="relative flex h-1.5 w-1.5 items-center justify-center">
                        {isAdminOnline && (
                            <motion.span 
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inline-flex h-full w-full rounded-full bg-red-500 blur-[2px]" 
                            />
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isAdminOnline ? 'bg-red-500 shadow-[0_0_5px_1px_#ef4444]' : 'bg-red-950 border border-red-900/40'}`} />
                    </div>
                </div>

                {/* Meteor Status Blinker */}
                <div className="flex items-center gap-2 justify-end">
                    <span className={`transition-colors duration-500 ${isMeteorInbound || isMeteorActive ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-white/30'}`}>
                        {isMeteorActive ? 'METEOR SHOWER ACTIVE' : isMeteorInbound ? 'METEOR INBOUND' : 'NO ACTIVITY DETECTED'}
                    </span>
                    <div className="relative flex h-1.5 w-1.5 items-center justify-center">
                        {(isMeteorInbound || isMeteorActive) && (
                            <motion.span 
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: isMeteorActive ? 0.3 : 1.2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inline-flex h-full w-full rounded-full bg-red-500 blur-[2px]" 
                            />
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isMeteorInbound || isMeteorActive ? 'bg-red-500 shadow-[0_0_5px_1px_#ef4444]' : 'bg-red-950 border border-red-900/40'}`} />
                    </div>
                </div>

            </div>

            {/* RIGHT: High-Fidelity Hardware Control Panel */}
            <div className="p-[3px] bg-[#161616] rounded-md border border-[#2a2a2a] shadow-[0_15px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col gap-[3px] w-[130px] relative">
                
                {/* Micro panel screws in the corners */}
                <div className="absolute top-[2px] left-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
                <div className="absolute top-[2px] right-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
                <div className="absolute bottom-[2px] left-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
                <div className="absolute bottom-[2px] right-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />

                {/* 1. REALISTIC LED CLOCK SCREEN */}
                <div className="w-full h-8 bg-[#020202] rounded-[3px] shadow-[inset_0_3px_8px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.05)] border border-black relative overflow-hidden flex items-center justify-center">
                    {/* Glass Glare */}
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent z-10 pointer-events-none" />
                    
                    {/* Active Neon Text */}
                    <div 
                        className="font-mono text-[12px] font-bold tracking-[0.15em] relative z-20 mt-[1px]"
                        style={{ 
                            color: 'var(--accent, #fff)',
                            textShadow: '0 0 4px var(--accent, rgba(255,255,255,0.8)), 0 0 10px var(--accent, rgba(255,255,255,0.3))' 
                        }}
                    >
                        {displayTime}
                    </div>

                    {/* CRT / LCD Scanline Texture */}
                    <div 
                        className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay opacity-40"
                        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)' }}
                    />
                </div>

                {/* 2. RUSTIC TEXTURED PUSH BUTTON */}
                <div className="w-full h-7 relative group">
                    <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                            className="relative group font-mono text-[9px] font-bold tracking-widest uppercase outline-none cursor-pointer shrink-0"
                    >
                        {/* 1. COMPACT BASE: Sits only 2px down */}
                        <div className="absolute inset-0 bg-red-950 rounded-[3px] translate-y-[2px]" />
                        
                        {/* 2. COMPACT CAP: Tighter padding, smaller text, snaps down 2px when clicked */}
                        <div className="relative flex items-center gap-1.5 px-9.5 py-1 bg-[#0a0202] border border-red-500/40 text-red-500 rounded-[3px] transform -translate-y-[1px] transition-all duration-75 active:translate-y-[2px] active:bg-[#1a0505] hover:bg-[#150303] hover:text-red-400 hover:border-red-400 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                            
                            {/* Micro indicator light */}
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_4px_red] group-hover:bg-red-400 group-hover:animate-pulse" />
                            
                            EJECT
                        </div>
                    </button>
                </div>

            </div>

        </div>
    );
}