"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Each side declares its own role.
// Her dashboard (page.tsx) has no role prop so it defaults to 'user'.
// His dashboard passes role="admin".
export default function TopControls({ role = "user" }: { role?: "user" | "admin" }) {
    const [time, setTime] = useState<Date | null>(null);
    // For her side: is admin online? For his side: is the user online?
    const [otherOnline, setOtherOnline] = useState(false);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Join the shared presence channel, declaring our own role
        const channel = supabase.channel('portal-presence', {
            config: { presence: { key: role } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                // We want to know if the OTHER role is present
                const targetRole = role === 'user' ? 'admin' : 'user';
                setOtherOnline(Object.keys(state).includes(targetRole));
            })
            .on('presence', { event: 'join' }, ({ key }) => {
                const targetRole = role === 'user' ? 'admin' : 'user';
                if (key === targetRole) setOtherOnline(true);
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                const targetRole = role === 'user' ? 'admin' : 'user';
                if (key === targetRole) setOtherOnline(false);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => { supabase.removeChannel(channel); };
    }, [role]);

    if (!time) return null;

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
    const isMeteorActive  = istHour === 23 && istMinute >= 55;

    // Label copy varies by whose screen we're on
    const presenceLabel = role === 'user'
        ? (otherOnline ? 'ADMIN IN MAINFRAME' : 'ADMIN OFFLINE')
        : (otherOnline ? 'MAHI IS ONLINE'     : 'MAHI OFFLINE');

    return (
        <div className="absolute top-6 right-8 z-50 flex items-start gap-5">
            
            {/* LEFT: System Blinkers */}
            <div className="flex flex-col gap-2 mt-2 font-mono text-[8px] tracking-[0.2em] text-right opacity-80">
                
                {/* Presence blinker */}
                <div className="flex items-center gap-2 justify-end">
                    <span className={`transition-colors duration-500 ${otherOnline ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-white/30'}`}>
                        {presenceLabel}
                    </span>
                    <div className="relative flex h-1.5 w-1.5 items-center justify-center">
                        {otherOnline && (
                            <motion.span 
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inline-flex h-full w-full rounded-full bg-red-500 blur-[2px]" 
                            />
                        )}
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${otherOnline ? 'bg-red-500 shadow-[0_0_5px_1px_#ef4444]' : 'bg-red-950 border border-red-900/40'}`} />
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
                
                <div className="absolute top-[2px] left-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
                <div className="absolute top-[2px] right-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
                <div className="absolute bottom-[2px] left-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
                <div className="absolute bottom-[2px] right-[2px] w-[2px] h-[2px] bg-black rounded-full shadow-[0_1px_0_rgba(255,255,255,0.1)]" />

                {/* LED Clock */}
                <div className="w-full h-8 bg-[#020202] rounded-[3px] shadow-[inset_0_3px_8px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.05)] border border-black relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent z-10 pointer-events-none" />
                    <div className="font-mono text-[12px] font-bold tracking-[0.15em] relative z-20 mt-[1px]"
                        style={{ color: 'var(--accent, #fff)', textShadow: '0 0 4px var(--accent, rgba(255,255,255,0.8)), 0 0 10px var(--accent, rgba(255,255,255,0.3))' }}>
                        {displayTime}
                    </div>
                    <div className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay opacity-40"
                        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #000 1px, #000 2px)' }} />
                </div>

                {/* Eject button */}
                <div className="w-full h-7 relative group">
                    <button onClick={() => signOut({ callbackUrl: '/login' })}
                        className="relative group font-mono text-[9px] font-bold tracking-widest uppercase outline-none cursor-pointer shrink-0">
                        <div className="absolute inset-0 bg-red-950 rounded-[3px] translate-y-[2px]" />
                        <div className="relative flex items-center gap-1.5 px-9.5 py-1 bg-[#0a0202] border border-red-500/40 text-red-500 rounded-[3px] transform -translate-y-[1px] transition-all duration-75 active:translate-y-[2px] active:bg-[#1a0505] hover:bg-[#150303] hover:text-red-400 hover:border-red-400 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_4px_red] group-hover:bg-red-400 group-hover:animate-pulse" />
                            EJECT
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}