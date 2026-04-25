"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, getSession } from 'next-auth/react';

const BOOT_SEQUENCE = [
  { text: "CELESTIAL OS v9.2.4 INITIALIZING...", delay: 0,    dim: true  },
  { text: "STELLAR RELAY: CONNECTED",            delay: 480,  dim: true  },
  { text: "WARNING: RESTRICTED MAINFRAME.",      delay: 900,  warn: true },
  { text: "PLEASE IDENTIFY YOURSELF.",           delay: 1340, accent: true },
];

export default function LoginPage() {
  const [step,      setStep]      = useState<'username' | 'password'>('username');
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [bootLines, setBootLines] = useState<typeof BOOT_SEQUENCE>([]);
  const [ready,     setReady]     = useState(false);
  const [profile,   setProfile]   = useState<{ name: string; emoji: string; color: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    BOOT_SEQUENCE.forEach((line, i) => {
      setTimeout(() => {
        setBootLines(prev => [...prev, line]);
        if (i === BOOT_SEQUENCE.length - 1) setTimeout(() => setReady(true), 300);
      }, line.delay + 200);
    });
  }, []);

  useEffect(() => {
    if (ready && status === 'idle') setTimeout(() => inputRef.current?.focus(), 80);
  }, [ready, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'username') {
      if (!username.trim()) return;
      setStep('password');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    if (!password.trim()) return;
    setStatus('loading');

    const result = await signIn('credentials', {
      redirect: false,
      username: username.trim().toLowerCase(),
      password,
    });

    if (result?.error) {
      setStatus('denied');
      setTimeout(() => {
        setStatus('idle');
        setStep('username');
        setUsername('');
        setPassword('');
      }, 2400);
    } else {
      const session = await getSession();
      const user    = session?.user as any;

      setProfile({
        name:  user?.name        || username,
        emoji: user?.avatarEmoji || '✦',
        color: user?.accentColor || '#ec4899',
      });
      setStatus('granted');

      setTimeout(() => {
        if (user?.id === 'architect-01') window.location.href = '/boyfriend';
        else                              window.location.href = '/v2';
      }, 2200);
    }
  };

  const lineStyle = (line: typeof BOOT_SEQUENCE[0]) => {
    if (line.accent) return { color: '#ec4899', textShadow: '0 0 8px #ec4899' };
    if (line.warn)   return { color: '#f59e0b', textShadow: 'none' };
    return               { color: 'rgba(236,72,153,0.45)', textShadow: 'none' };
  };

  return (
    <div className="h-screen w-screen bg-[#040404] flex items-center justify-center p-6 overflow-hidden font-mono text-white selection:bg-pink-500/30">

      <style jsx global>{`
        @keyframes scanline  { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes blink     { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .scanline { animation: scanline 9s linear infinite; }
        .blink    { animation: blink 1s step-end infinite; }
      `}</style>

      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.05] to-transparent scanline pointer-events-none z-40" />
      <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.08]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 1px,#000 1px,#000 2px)' }} />
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(236,72,153,0.07) 0%, transparent 68%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.9 }}
        className="w-full max-w-md z-10"
      >
        <div className="rounded-xl overflow-hidden border border-white/[0.08]"
          style={{ background: 'rgba(5,3,10,0.94)', backdropFilter: 'blur(24px)', boxShadow: '0 0 60px rgba(236,72,153,0.07), 0 40px 80px rgba(0,0,0,0.6)' }}>

          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.025)' }}>
            <div className="flex gap-1.5">
              {['#ff5f57','#ffbd2e','#28c840'].map(c => (
                <div key={c} className="w-2.5 h-2.5 rounded-full opacity-50" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[8px] tracking-[0.5em] uppercase text-white/20">celestial_auth.exe</span>
            <div className="w-12" />
          </div>

          <div className="p-7 md:p-9 min-h-[320px] flex flex-col">

            {/* Boot lines */}
            <div className="flex flex-col gap-1.5 mb-7">
              {bootLines.map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}
                  className="text-[10px] md:text-[11px] tracking-[0.18em] uppercase"
                  style={lineStyle(line)}>
                  {line.text}
                </motion.div>
              ))}
            </div>

            {/* ACCESS GRANTED — avatar reveal */}
            <AnimatePresence>
              {status === 'granted' && profile && (
                <motion.div key="granted"
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center gap-5 pb-4">

                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0   }}
                    transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.1 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl border-2"
                    style={{
                      borderColor:     profile.color,
                      backgroundColor: `${profile.color}15`,
                      boxShadow:       `0 0 40px ${profile.color}50, 0 0 80px ${profile.color}20`,
                    }}>
                    {profile.emoji}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                    className="text-center flex flex-col gap-1.5">
                    <div className="text-[9px] tracking-[0.5em] uppercase text-green-400">ACCESS GRANTED</div>
                    <div className="text-2xl font-black tracking-tight"
                      style={{ color: profile.color, textShadow: `0 0 20px ${profile.color}80` }}>
                      WELCOME BACK, {profile.name.toUpperCase()}
                    </div>
                    <div className="text-[8px] tracking-[0.4em] uppercase text-white/25 mt-0.5">
                      INITIALIZING PORTAL...
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status messages */}
            <AnimatePresence>
              {status === 'denied' && (
                <motion.div key="denied"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[10px] tracking-[0.25em] uppercase text-red-500 font-bold mb-4">
                  &gt; ACCESS DENIED. IDENTITY UNRECOGNIZED.
                </motion.div>
              )}
              {status === 'loading' && (
                <motion.div key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[10px] tracking-[0.25em] uppercase text-amber-400/80 mb-4">
                  &gt; VERIFYING CREDENTIALS...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            {(status === 'idle' || status === 'denied') && ready && (
              <div className="mt-auto flex flex-col gap-2">
                {step === 'password' && (
                  <div className="flex items-center gap-3 text-lg text-white/25">
                    <span style={{ color: 'rgba(236,72,153,0.4)' }}>&gt;</span>
                    <span className="tracking-widest">{username}</span>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-3 text-lg md:text-xl">
                    <span style={{ color: '#ec4899', textShadow: '0 0 8px #ec4899' }}>&gt;</span>
                    <input
                      ref={inputRef}
                      type={step === 'password' ? 'password' : 'text'}
                      value={step === 'password' ? password : username}
                      onChange={e => step === 'password' ? setPassword(e.target.value) : setUsername(e.target.value)}
                      autoComplete="off" autoCapitalize="off" spellCheck={false}
                      placeholder={step === 'username' ? 'ENTER_IDENTIFIER' : 'ENTER_PASSPHRASE'}
                      className="bg-transparent border-none outline-none flex-1 tracking-widest text-white placeholder-white/15"
                    />
                    <span className="w-2.5 h-5 blink shrink-0" style={{ backgroundColor: '#ec4899' }} />
                  </div>
                  <div className="h-px mt-2"
                    style={{ background: 'linear-gradient(to right, #ec489999, transparent)' }} />
                </form>
                <div className="text-[7px] tracking-[0.35em] uppercase text-white/15 mt-1">
                  {step === 'username' ? 'TYPE IDENTIFIER & PRESS ENTER' : 'TYPE PASSPHRASE & PRESS ENTER'}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}