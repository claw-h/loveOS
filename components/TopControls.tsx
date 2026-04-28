"use client";

import { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import { NotificationContext } from '@/lib/notificationContext';


const ProfileModal = lazy(() => import('@/components/ProfileModal'));

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Each side declares its own role.
// Her dashboard (page.tsx) has no role prop so it defaults to 'user'.
// His dashboard passes role="admin".
export default function TopControls({ role = "user" }: { role?: "user" | "admin" }) {
    const [time, setTime] = useState<Date | null>(null);
    const [otherOnline, setOtherOnline] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notificationContext = useContext(NotificationContext);
    const { data: session } = useSession();

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

            {/* RIGHT: Control Panel with Curtain Menu */}
            <div className="flex flex-col gap-2 w-44">
                
                {/* LED Clock */}
                <div className="w-full h-8 bg-[#020202] rounded border border-white/10 shadow-sm relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-linear-to-b from-white/5 to-transparent z-10 pointer-events-none" />
                    <div className="font-mono text-[12px] font-bold tracking-[0.15em] relative z-20 mt-px"
                        style={{ color: 'var(--accent, #fff)' }}>
                        {displayTime}
                    </div>
                </div>

                {/* CURTAIN MENU BUTTON - pulls down to reveal three buttons */}
                <motion.div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-full h-8 px-3 bg-white/5 border border-white/20 rounded font-mono text-[9px] font-bold tracking-widest uppercase text-white/80 hover:bg-white/8 hover:border-white/30 transition-all duration-200 flex items-center justify-center gap-1"
                    >
                        <span>{menuOpen ? '▲' : '▼'}</span>
                        <span>MENU</span>
                    </button>

                    {/* Curtain Content - slides down */}
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scaleY: 0, y: -10, originY: 0 }}
                                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                                exit={{ opacity: 0, scaleY: 0, y: -10 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className="absolute top-full left-0 right-0 mt-1 bg-white/3 border border-white/15 rounded shadow-lg overflow-hidden z-50 backdrop-blur-sm flex flex-col gap-1 p-2"
                            >
                                

                                {/* NOTIFICATIONS BUTTON */}
                                <button
                                    className="w-full h-8 px-3 bg-white/5 border border-white/20 rounded font-mono text-[9px] font-bold tracking-widest uppercase text-white/80 hover:bg-white/8 hover:border-white/30 transition-all duration-200 flex items-center justify-between"
                                >
                                    <span>📡 ALERTS</span>
                                    {notificationContext?.offlineNotifications?.length ? (
                                        <span className="text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
                                            {notificationContext.offlineNotifications.length}
                                        </span>
                                    ) : null}
                                </button>



                                
                                {/* IDENTITY BUTTON */}
                                <button
                                    onClick={() => { setProfileOpen(true); setMenuOpen(false); }}
                                    className="w-full h-8 px-3 bg-white/5 border border-white/20 rounded font-mono text-[9px] font-bold tracking-widest uppercase text-white/80 hover:bg-white/8 hover:border-white/30 transition-all duration-200"
                                >
                                    ⟡ IDENTITY
                                </button>



                                
                                {/* LOGOUT BUTTON */}
                                <button
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            sessionStorage.removeItem("love-os-booted");
                                        }
                                        signOut({ callbackUrl: '/login' });
                                    }}
                                    className="w-full h-8 px-3 bg-red-500/15 border border-red-500/30 rounded font-mono text-[9px] font-bold tracking-widest uppercase text-red-400/80 hover:bg-red-500/25 hover:border-red-500/50 transition-all duration-200"
                                >
                                    ⟲ LOGOUT
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ALERTS DETAIL MODAL - shows offline notifications */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: 0.1 }}
                            className="relative mt-1 bg-white/3 border border-white/15 rounded shadow-lg overflow-hidden z-50 backdrop-blur-sm"
                        >
                            <div className="max-h-48 overflow-y-auto">
                                {notificationContext?.offlineNotifications && notificationContext.offlineNotifications.length > 0 ? (
                                    notificationContext.offlineNotifications.map(notif => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 5 }}
                                            className="px-3 py-2 border-b border-white/10 text-[8px] hover:bg-white/5 transition-colors flex gap-2 group last:border-0"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-mono font-bold truncate text-white/80">
                                                    {notif.title}
                                                </div>
                                                {notif.timestamp && (
                                                    <div className="text-[7px] text-white/40 mt-0.5">
                                                        {new Date(notif.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => notificationContext.dismissOfflineNotification(notif.id)}
                                                className="text-white/30 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100 shrink-0 text-xs leading-none pt-0.5"
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="px-3 py-3 text-center">
                                        <p className="font-mono text-[7px] text-white/30 uppercase">NO ALERTS</p>
                                    </div>
                                )}
                            </div>
                            {notificationContext?.offlineNotifications && notificationContext.offlineNotifications.length > 0 && (
                                <button
                                    onClick={() => {
                                        notificationContext.offlineNotifications.forEach(n => 
                                            notificationContext.dismissOfflineNotification(n.id)
                                        );
                                    }}
                                    className="w-full px-3 py-1.5 border-t border-white/10 text-[7px] font-mono tracking-widest uppercase hover:bg-white/5 transition-colors text-white/60"
                                >
                                    CLEAR ALL
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Profile Modal - opened from IDENTITY button */}
            <Suspense fallback={null}>
                <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
            </Suspense>
        </div>);}   